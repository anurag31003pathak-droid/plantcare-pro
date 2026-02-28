from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from passlib.context import CryptContext

from .database import get_db
from .models import PredictionLog
from .ml_model import PlantDiseaseModel

router = APIRouter()
model_instance = PlantDiseaseModel()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.get("/health")
def health_check():
    return {"status": "ok", "message": "PlantCare PRO API is running."}

@router.post("/predict")
async def predict_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    try:
        image_bytes = await file.read()
        
        # Max file size 5MB
        if len(image_bytes) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 5MB)")

        prediction = model_instance.predict(image_bytes)
        
        # Log to database conditionally
        try:
            log_entry = PredictionLog(
                filename=file.filename,
                predicted_class=prediction["class_name"],
                confidence=prediction["confidence"]
            )
            db.add(log_entry)
            db.commit()
            db.refresh(log_entry)
        except Exception as db_err:
            print(f"Database logging failed: {db_err}")
            db.rollback()

        return {
            "prediction": prediction["class_name"],
            "confidence": prediction["confidence"]
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error during prediction.")

@router.get("/history")
def get_prediction_history(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    try:
        logs = db.query(PredictionLog).order_by(PredictionLog.created_at.desc()).offset(skip).limit(limit).all()
        return [
            {
                "id": log.id,
                "filename": log.filename,
                "predicted_class": log.predicted_class,
                "confidence": log.confidence,
                "created_at": log.created_at
            } for log in logs
        ]
    except Exception as e:
         # Database might not be initialized yet in local dev without docker
         print(f"Failed to fetch history: {e}")
         return []
