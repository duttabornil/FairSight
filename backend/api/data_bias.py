from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import pandas as pd
import io
import numpy as np

router = APIRouter()

@router.post("/analyze")
async def analyze_data(
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
    
    if sensitive_attribute not in df.columns or target_attribute not in df.columns:
        raise HTTPException(status_code=400, detail="Sensitive or target attribute not found in columns")

    # Drop missing values in the relevant columns for analysis
    df = df.dropna(subset=[sensitive_attribute, target_attribute])
    
    groups = df[sensitive_attribute].unique()
    stats = []
    
    # Calculate positive rate per group
    # Assuming target_attribute is binary (0/1 or False/True or equivalent)
    # We will try to infer positive class. If numeric, assume 1 is positive.
    target_unique = df[target_attribute].unique()
    if len(target_unique) != 2:
        # Simplification: just take the most frequent as positive if not binary, or just return basic stats
        # For a robust implementation, user should specify the positive outcome. 
        # Here we assume the maximum value is the "positive" outcome (e.g. 1 in [0,1], 'Yes' in ['No', 'Yes'])
        pass
    
    positive_outcome = max(target_unique)
    overall_positive_rate = len(df[df[target_attribute] == positive_outcome]) / len(df) if len(df) > 0 else 0

    group_rates = {}
    for group in groups:
        group_df = df[df[sensitive_attribute] == group]
        count = len(group_df)
        if count == 0:
            continue
        positive_count = len(group_df[group_df[target_attribute] == positive_outcome])
        rate = positive_count / count
        group_rates[group] = rate
        stats.append({
            "group": str(group),
            "count": count,
            "positive_count": positive_count,
            "positive_rate": round(rate, 4)
        })
    
    # Calculate Disparate Impact (4/5ths Rule)
    # Ratio of positive rate of each group to the maximum positive rate
    if len(group_rates) > 0:
        max_rate = max(group_rates.values())
        for stat in stats:
            rate = stat["positive_rate"]
            di = rate / max_rate if max_rate > 0 else 1.0
            stat["disparate_impact_ratio"] = round(di, 4)
            stat["flag"] = "red" if di < 0.8 else "green"
            
    return {
        "sensitive_attribute": sensitive_attribute,
        "target_attribute": target_attribute,
        "positive_outcome_inferred": str(positive_outcome),
        "overall_positive_rate": round(overall_positive_rate, 4),
        "group_stats": stats,
        "columns": list(df.columns)
    }

@router.post("/columns")
async def get_columns(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    content = await file.read()
    try:
        # Read only the first row to get columns
        df = pd.read_csv(io.StringIO(content.decode('utf-8')), nrows=0)
        return {"columns": list(df.columns)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {str(e)}")
