from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
import pandas as pd
import io
import numpy as np
from fairlearn.preprocessing import CorrelationRemover
from sklearn.utils import resample

router = APIRouter()

@router.post("/suggest")
async def suggest_mitigation(
    file: UploadFile = File(...),
    sensitive_attribute: str = Form(...),
    target_attribute: str = Form(...)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    try:
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {str(e)}")

    if sensitive_attribute not in df.columns:
        raise HTTPException(status_code=400, detail="Sensitive attribute not found")

    df = df.dropna()

    suggestions = [
        {
            "name": "Resampling",
            "description": "Balances the dataset by uniformly resampling all combinations of groups and outcomes. This fixes historical outcome bias in the dataset itself.",
            "type": "Pre-processing"
        },
        {
            "name": "Correlation Remover",
            "description": "Applies a linear transformation to features so they become uncorrelated with the sensitive attribute. Does not change outcomes, but debiases features for training.",
            "type": "Pre-processing"
        },
        {
            "name": "Threshold Optimizer",
            "description": "Adjusts prediction thresholds per group to achieve fairness constraints like Equalized Odds.",
            "type": "Post-processing"
        }
    ]

    return {
        "suggestions": suggestions,
        "message": "To apply mitigation, use the /apply endpoint."
    }


@router.post("/apply")
async def apply_mitigation(
    file: UploadFile = File(...),
    sensitive_attribute: str = Form(...),
    target_attribute: str = Form(...),
    method: str = Form(...)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    df = pd.read_csv(io.StringIO(content.decode('utf-8')))
    df = df.dropna()

    if sensitive_attribute not in df.columns:
        raise HTTPException(status_code=400, detail="Sensitive attribute not found")
    if target_attribute not in df.columns:
        raise HTTPException(status_code=400, detail="Target attribute not found")

    if method == "Resampling":
        # To actually remove bias in the dataset outcomes (make disparate impact ~ 1.0),
        # we balance the dataset across the intersection of sensitive_attr and target_attr.
        group_counts = df.groupby([sensitive_attribute, target_attribute]).size()
        majority_count = group_counts.max()

        resampled_groups = []
        for (sens_val, target_val), count in group_counts.items():
            subgroup_df = df[(df[sensitive_attribute] == sens_val) & (df[target_attribute] == target_val)]
            if len(subgroup_df) == majority_count:
                resampled_groups.append(subgroup_df)
            else:
                resampled = resample(
                    subgroup_df,
                    replace=True,
                    n_samples=majority_count,
                    random_state=42
                )
                resampled_groups.append(resampled)

        transformed_df = pd.concat(resampled_groups).reset_index(drop=True)

    elif method == "Correlation Remover":
        # Work on a copy — never modify original labels
        df_work = df.copy()

        # Cols to transform: numeric only, exclude id, target, sensitive
        cols_to_exclude = {"id", target_attribute, sensitive_attribute}
        numeric_cols = df_work.select_dtypes(include=[np.number]).columns.tolist()
        feature_cols = [c for c in numeric_cols if c not in cols_to_exclude]

        # Encode sensitive attribute in work copy only
        sensitive_encoded = df_work[sensitive_attribute].astype('category').cat.codes
        df_work["_sensitive_encoded"] = sensitive_encoded

        features_with_sensitive = df_work[feature_cols + ["_sensitive_encoded"]]

        cr = CorrelationRemover(sensitive_feature_ids=["_sensitive_encoded"])
        cr.fit(features_with_sensitive)
        features_transformed = cr.transform(features_with_sensitive)

        transformed_df = df.copy()  # start from original (preserves string labels)
        for i, col in enumerate(feature_cols):
            transformed_df[col] = features_transformed[:, i]

    else:
        raise HTTPException(status_code=400, detail=f"Method '{method}' not implemented yet")

    # Stream back as CSV
    output = io.StringIO()
    transformed_df.to_csv(output, index=False)
    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=debiased_{file.filename}"}
    )
