from flask import Flask, request, jsonify
from flask_cors import CORS
from app.database import init_db, SessionLocal
from app.models import PredictionLog
from app.ml_model import model_instance

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "https://frontend-iota-ashy-73.vercel.app"]}}, supports_credentials=True)

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "message": "PlantCare PRO API is running."})

@app.route("/predict", methods=["POST"])
def predict_image():
    if 'file' not in request.files:
        return jsonify({"detail": "No file part in the request"}), 400
        
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"detail": "No selected file"}), 400
        
    if not file.content_type.startswith("image/"):
         return jsonify({"detail": "File provided is not an image."}), 400

    try:
        image_bytes = file.read()
        
        if len(image_bytes) > 5 * 1024 * 1024:
            return jsonify({"detail": "File too large (max 5MB)"}), 400

        prediction = model_instance.predict(image_bytes)
        
        # Log to db
        db = SessionLocal()
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
        finally:
            db.close()

        return jsonify({
            "prediction": prediction["class_name"],
            "confidence": prediction["confidence"],
            "description": prediction.get("description", "No description available."),
            "causes": prediction.get("causes", "Unknown causes."),
            "treatment": prediction.get("treatment", "No treatment available.")
        })
    except ValueError as ve:
        return jsonify({"detail": str(ve)}), 400
    except Exception as e:
        print(e)
        return jsonify({"detail": "Internal server error during prediction."}), 500

@app.route("/history", methods=["GET"])
def get_prediction_history():
    db = SessionLocal()
    try:
        skip = int(request.args.get("skip", 0))
        limit = int(request.args.get("limit", 50))
        
        logs = db.query(PredictionLog).order_by(PredictionLog.created_at.desc()).offset(skip).limit(limit).all()
        return jsonify([
            {
                "id": log.id,
                "filename": log.filename,
                "predicted_class": log.predicted_class,
                "confidence": log.confidence,
                "created_at": log.created_at.isoformat()
            } for log in logs
        ])
    except Exception as e:
         print(f"Failed to fetch history: {e}")
         return jsonify([])
    finally:
         db.close()

# Initialize the database immediately on import for gunicorn
with app.app_context():
    init_db()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8001, debug=True)
