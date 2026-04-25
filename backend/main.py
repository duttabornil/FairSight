from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from api import data_bias, model_bias, mitigation

app = FastAPI(title="FairSight API", description="API for bias detection and mitigation in datasets and machine learning models")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data_bias.router, prefix="/api/data", tags=["Data Bias"])
app.include_router(model_bias.router, prefix="/api/model", tags=["Model Bias"])
app.include_router(mitigation.router, prefix="/api/mitigation", tags=["Mitigation"])

@app.get("/")
def read_root():
    return {"message": "Welcome to FairSight API"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
