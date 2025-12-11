from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import uvicorn
import random

app = FastAPI()

# Enable CORS to allow requests from the frontend
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionRequest(BaseModel):
    features: List[float]

@app.get("/")
def read_root():
    return {"message": "Customer Churn Prediction API is running"}

@app.post("/predict")
def predict(request: PredictionRequest):
    # Extract features
    # features[0]: tenure
    # features[1]: monthly_charges
    # features[2]: contract (0: Month-to-month, 1: One year, 2: Two year)
    
    tenure = request.features[0]
    monthly_charges = request.features[1]
    contract = request.features[2]
    
    # Simple rule-based logic (mocking a model)
    # High churn probability if month-to-month contract and high monthly charges
    score = 0
    if contract == 0: # Month-to-month
        score += 0.5
    if monthly_charges > 50:
        score += 0.3
    if tenure < 12:
        score += 0.3
        
    # Add some randomness
    score += random.uniform(-0.1, 0.1)
    
    # Normalize score to 0-1 range for probability
    probability = max(0.0, min(1.0, score))
    
    prediction = 1 if probability > 0.6 else 0
    
    return {"prediction": prediction, "probability": probability}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
