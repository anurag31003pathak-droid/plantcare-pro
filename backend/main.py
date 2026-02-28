from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import bcrypt
import os
from app.database import init_db, SessionLocal
from app.models import PredictionLog, User
from app.ml_model import model_instance
app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-plantcare-key-change-me-in-prod")
jwt = JWTManager(app)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "https://frontend-iota-ashy-73.vercel.app", "https://plantcare-pro.vercel.app"]}}, supports_credentials=True)

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"detail": "Invalid JSON"}), 400
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"detail": "Email and password are required"}), 400
    
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == email).first():
            return jsonify({"detail": "Email already registered"}), 400
        
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user = User(email=email, password_hash=hashed_password)
        db.add(user)
        db.commit()
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        db.rollback()
        return jsonify({"detail": "Internal server error"}), 500
    finally:
        db.close()

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"detail": "Invalid JSON"}), 400
    email = data.get("email")
    password = data.get("password")
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
            return jsonify({"detail": "Invalid credentials"}), 401
            
        access_token = create_access_token(identity=str(user.id))
        return jsonify({"access_token": access_token}), 200
    except Exception as e:
        return jsonify({"detail": "Internal server error"}), 500
    finally:
        db.close()

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "message": "PlantCare PRO API is running."})

@app.route("/predict", methods=["POST"])
@jwt_required()
def predict_image():
    current_user_id = get_jwt_identity()
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
                user_id=int(current_user_id),
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
@jwt_required()
def get_prediction_history():
    current_user_id = int(get_jwt_identity())
    db = SessionLocal()
    try:
        skip = int(request.args.get("skip", 0))
        limit = int(request.args.get("limit", 50))
        
        logs = db.query(PredictionLog).filter(PredictionLog.user_id == current_user_id).order_by(PredictionLog.created_at.desc()).offset(skip).limit(limit).all()
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
