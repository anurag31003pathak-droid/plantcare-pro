# PlantCare AI: Advanced Plant Disease Detection System

A production-ready, full-stack application that uses Transfer Learning (MobileNetV2) to detect 38 plant disease classes from leaf images.

## Features

- **Machine Learning**: TensorFlow/Keras script for fine-tuning MobileNetV2 with Data Augmentation.
- **Backend API**: High-performance FastAPI backend with PostgreSQL logging.
- **Frontend App**: Modern React 18 UI with TailwindCSS and Framer Motion for a stunning user experience. Includes Drag & Drop and real-time inference mapping.
- **Infrastructure**: Fully Dockerized ready for local execution and cloud deployment.

## Project Structure

```
.
├── backend/               # FastAPI application
│   ├── app/               # Routes, Database Models, and ML Helper
│   ├── main.py            # API Entrypoint
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile
├── frontend/              # Vite + React application
│   ├── src/               # React components and Tailwind CSS
│   ├── package.json       # Node dependencies
│   ├── tailwind.config.js # Tailwind Config
│   └── Dockerfile
├── ml/                    # Machine Learning codebase
│   ├── train.py           # Model training script
│   └── requirements.txt
└── docker-compose.yml     # Orchestration
```

## Step-by-Step Run Instructions

### Option 1: Run via Docker (Recommended, Easiest)

1. Make sure Docker and Docker Compose are installed and running.
2. In the root of this project (`plantcare-ai/`), simply run:
   ```bash
   docker-compose up --build
   ```
3. Access the interfaces:
   - **Frontend App**: [http://localhost](http://localhost) (or `http://localhost:5173` if running locally without Docker frontend).
   - **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

*Note: The system gracefully handles missing ML models by generating mocked high-confidence predictions so you can test the UI and database flow immediately.*

### Option 2: Train the Model

1. Navigate to the `ml` folder:
   ```bash
   cd ml
   ```
2. Create standard Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
3. Prepare the dataset: Place your images inside the `ml/dataset/<class_name>/` folders.
4. Run training:
   ```bash
   python train.py
   ```
5. Move the resulting `plantcare_model.h5` into `backend/app/` or map it via docker-compose volumes so the backend can load it.

## API Endpoints

- `GET /health` - Check backend health status.
- `POST /predict` - Upload image (`multipart/form-data` with `file` key) for disease detection.
- `GET /history` - Get paginated database log of recent predictions.
