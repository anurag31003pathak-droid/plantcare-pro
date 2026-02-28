import os
import io
import numpy as np
from PIL import Image
try:
    import tensorflow as tf
except ImportError:
    tf = None

# 38 Classes mapping from standard PlantVillage dataset
CLASS_NAMES = [
    'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy',
    'Blueberry___healthy', 'Cherry_(including_sour)___Powdery_mildew', 
    'Cherry_(including_sour)___healthy', 'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot', 
    'Corn_(maize)___Common_rust_', 'Corn_(maize)___Northern_Leaf_Blight', 'Corn_(maize)___healthy', 
    'Grape___Black_rot', 'Grape___Esca_(Black_Measles)', 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', 
    'Grape___healthy', 'Orange___Haunglongbing_(Citrus_greening)', 'Peach___Bacterial_spot',
    'Peach___healthy', 'Pepper,_bell___Bacterial_spot', 'Pepper,_bell___healthy', 
    'Potato___Early_blight', 'Potato___Late_blight', 'Potato___healthy', 
    'Raspberry___healthy', 'Soybean___healthy', 'Squash___Powdery_mildew', 
    'Strawberry___Leaf_scorch', 'Strawberry___healthy', 'Tomato___Bacterial_spot', 
    'Tomato___Early_blight', 'Tomato___Late_blight', 'Tomato___Leaf_Mold', 
    'Tomato___Septoria_leaf_spot', 'Tomato___Spider_mites Two-spotted_spider_mite', 
    'Tomato___Target_Spot', 'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus',
    'Tomato___healthy'
]

from app.disease_info import DISEASE_INFO

class PlantDiseaseModel:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PlantDiseaseModel, cls).__new__(cls)
            cls._instance.model = None
            cls._instance._load_model()
        return cls._instance

    def _load_model(self):
        model_path = os.getenv("MODEL_PATH", "../ml/plantcare_model.h5")
        if tf and os.path.exists(model_path):
            try:
                self.model = tf.keras.models.load_model(model_path)
                print(f"Model loaded successfully from {model_path}")
            except Exception as e:
                print(f"Error loading model: {e}")
        else:
            print(f"Warning: Model not found at {model_path} or TensorFlow not available. Inference will be mocked.")

    def predict(self, image_bytes: bytes):
        try:
            image = Image.open(io.BytesIO(image_bytes))
            if image.mode != "RGB":
                image = image.convert("RGB")
            
            image = image.resize((224, 224))
            img_array = np.array(image) / 255.0
            img_array = np.expand_dims(img_array, axis=0)

            if self.model:
                predictions = self.model.predict(img_array)[0]
                predicted_class_idx = np.argmax(predictions)
                confidence = float(predictions[predicted_class_idx])
                
                if predicted_class_idx < len(CLASS_NAMES):
                    raw_class_name = str(CLASS_NAMES[predicted_class_idx])
                else:
                    raw_class_name = f"Class_{predicted_class_idx}"
            else:
                raw_class_name = str(np.random.choice(CLASS_NAMES))
                confidence = float(np.random.uniform(0.6, 0.99))

            info = DISEASE_INFO.get(raw_class_name, {
                'description': 'Information not available for this class.',
                'causes': 'Unknown.',
                'treatment': 'Consult a local agricultural extension for more advice.'
            })

            return {
                "class_name": raw_class_name.replace("___", " - ").replace("_", " "),
                "confidence": confidence,
                "description": info['description'],
                "causes": info['causes'],
                "treatment": info['treatment']
            }
        except Exception as e:
            raise ValueError(f"Error processing image: {str(e)}")

model_instance = PlantDiseaseModel()
