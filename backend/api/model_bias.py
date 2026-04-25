from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import pandas as pd
import io
import numpy as np
from fairlearn.metrics import (
    demographic_parity_difference,
    demographic_parity_ratio,
    equalized_odds_difference,
    equalized_odds_ratio,
    true_positive_rate,
    false_positive_rate,
    MetricFrame
)
from sklearn.metrics import accuracy_score, precision_score, recall_score

router = APIRouter()

@router.post("/analyze")
async def analyze_model(
    file: UploadFile = File(...),
    sensitive_attribute: str = Form(...),
    true_label_attribute: str = Form(...),
    pred_label_attribute: str = Form(...)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    content = await file.read()
    try:
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {str(e)}")
    
    required_cols = [sensitive_attribute, true_label_attribute, pred_label_attribute]
    if not all(col in df.columns for col in required_cols):
        raise HTTPException(status_code=400, detail="One or more required columns not found")

    df = df.dropna(subset=required_cols)
    y_true = df[true_label_attribute]
    y_pred = df[pred_label_attribute]
    sensitive_features = df[sensitive_attribute]

    # Overall metrics
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)

    # Fairness metrics using MetricFrame
    metrics_dict = {
        'accuracy': accuracy_score,
        'precision': lambda yt, yp: precision_score(yt, yp, zero_division=0),
        'tpr': true_positive_rate,
        'fpr': false_positive_rate,
        'selection_rate': lambda yt, yp: np.mean(yp) # positive prediction rate
    }
    
    try:
        mf = MetricFrame(
            metrics=metrics_dict,
            y_true=y_true,
            y_pred=y_pred,
            sensitive_features=sensitive_features
        )
        
        group_metrics = mf.by_group.to_dict(orient='index')
        
        # Format for frontend
        formatted_group_metrics = []
        for group, m in group_metrics.items():
            formatted_group_metrics.append({
                "group": str(group),
                "accuracy": round(m['accuracy'], 4),
                "precision": round(m['precision'], 4),
                "tpr": round(m['tpr'], 4),
                "fpr": round(m['fpr'], 4),
                "selection_rate": round(m['selection_rate'], 4)
            })

        dp_diff = demographic_parity_difference(y_true, y_pred, sensitive_features=sensitive_features)
        dp_ratio = demographic_parity_ratio(y_true, y_pred, sensitive_features=sensitive_features)
        eo_diff = equalized_odds_difference(y_true, y_pred, sensitive_features=sensitive_features)
        eo_ratio = equalized_odds_ratio(y_true, y_pred, sensitive_features=sensitive_features)

        return {
            "overall_metrics": {
                "accuracy": round(acc, 4),
                "precision": round(prec, 4),
                "recall": round(rec, 4)
            },
            "fairness_metrics": {
                "demographic_parity_difference": round(dp_diff, 4),
                "demographic_parity_ratio": round(dp_ratio, 4),
                "equalized_odds_difference": round(eo_diff, 4),
                "equalized_odds_ratio": round(eo_ratio, 4),
            },
            "group_metrics": formatted_group_metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating metrics: {str(e)}")
