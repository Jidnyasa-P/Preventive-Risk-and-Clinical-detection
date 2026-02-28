# 🩺 PreventAI – Diabetes Risk Clinical Decision Support System

**Full-stack AI-powered clinical tool for early diabetes risk detection.**

| Layer | Stack |
|-------|-------|
| Frontend | React 19 · TypeScript · Vite · Tailwind CSS v4 · Recharts |
| Auth Server | Node.js · Express · SQLite · JWT |
| ML Backend | Python · FastAPI · scikit-learn · SHAP |
| AI Insights | OpenAI GPT-4o-mini **or** Google Gemini (configurable) |

---

## 📁 Project Structure

```
PreventAI/
├── frontend/                   # React SPA + Node.js auth server
│   ├── src/
│   │   ├── components/         # All React UI components
│   │   ├── services/
│   │   │   └── aiService.ts    # Calls Python FastAPI backend
│   │   ├── types.ts            # Shared TypeScript types
│   │   └── App.tsx             # Root app with routing
│   ├── server.ts               # Express auth server (login/signup/JWT)
│   ├── vite.config.ts
│   ├── package.json
│   └── .env.example
│
└── backend/                    # Python FastAPI ML + GenAI service
    ├── main.py                 # FastAPI app, routes, CORS
    ├── model.py                # RandomForest load/train/predict
    ├── explain.py              # SHAP explainability
    ├── ai_service.py           # OpenAI / Gemini LLM integration
    ├── schemas.py              # Pydantic request/response models
    ├── diabetes_model.pkl      # Pre-trained model (97% accuracy)
    ├── requirements.txt
    └── .env.example
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+
- **Python** 3.9+

---

### Step 1 – Start the Python Backend (FastAPI)

```bash
cd backend

# Create a virtual environment (recommended)
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env: set LLM_PROVIDER and LLM_API_KEY

# Copy the dataset (for auto-retraining if model is missing)
# The pre-trained diabetes_model.pkl is already included

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

✅ Backend running at: **http://localhost:8000**
📖 API docs: **http://localhost:8000/docs**

---

### Step 2 – Start the Frontend + Auth Server

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000

# Start the dev server (runs both Vite + Express auth)
npm run dev
```

✅ App running at: **http://localhost:3000**

---

## 🔗 How Frontend ↔ Backend Connect

```
Browser (React)
    │
    ├── /api/*  ──────────────►  Node.js Express (port 3000)
    │                              Auth: login, signup, logout, profile
    │                              Database: SQLite (preventai.db)
    │
    └── fetch() to VITE_API_URL ► Python FastAPI (port 8000)
                                   POST /predict   → full risk assessment
                                   POST /predict/quick → ML-only
                                   GET  /health    → liveness
```

The key file is `frontend/src/services/aiService.ts` — it sends the `PatientData`
object from `PatientForm.tsx` to the FastAPI `/predict` endpoint and receives a
`RiskResult` object that `RiskDashboard.tsx` renders directly.

---

## 🧠 API Reference

### `POST /predict` — Full Risk Assessment

**Request** (camelCase, matches TypeScript `PatientData`)
```json
{
  "gender": "Male",
  "age": 52,
  "hypertension": true,
  "heartDisease": false,
  "smokingHistory": "former",
  "bmi": 31.2,
  "hba1cLevel": 6.8,
  "bloodGlucoseLevel": 180
}
```

**Response** (matches TypeScript `RiskResult`)
```json
{
  "riskScore": 74.2,
  "riskCategory": "High",
  "featureImportance": [
    { "feature": "HbA1c Level",         "importance": 38.1 },
    { "feature": "Blood Glucose Level", "importance": 27.4 },
    { "feature": "Age",                 "importance": 15.6 },
    { "feature": "BMI",                 "importance": 12.2 },
    { "feature": "Hypertension",        "importance": 4.1  }
  ],
  "doctorView": {
    "explanation": "...",
    "diagnosticTests": ["HbA1c measurement", "Fasting plasma glucose", "..."],
    "recommendations": ["Endocrinology referral", "..."]
  },
  "patientView": {
    "explanation": "...",
    "lifestyleAdvice":           ["..."],
    "dietSuggestions":           ["..."],
    "exerciseRecommendations":   ["..."]
  },
  "counterfactuals": ["Reducing BMI by 5% could lower your risk by ~10%", "..."]
}
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable       | Default              | Description                              |
|----------------|----------------------|------------------------------------------|
| `LLM_PROVIDER` | `openai`             | `openai` or `gemini`                     |
| `LLM_API_KEY`  | *(required)*         | API key for chosen LLM provider          |
| `LLM_MODEL`    | `gpt-4o-mini`        | Model name override                      |
| `MODEL_PATH`   | `diabetes_model.pkl` | Path to saved sklearn model              |
| `DATASET_PATH` | `diabetes_dataset.csv` | CSV used if model is missing           |
| `CORS_ORIGINS` | `http://localhost:3000,...` | Allowed frontend origins          |

### Frontend (`frontend/.env`)

| Variable       | Default                    | Description                    |
|----------------|----------------------------|--------------------------------|
| `VITE_API_URL` | `http://localhost:8000`    | Python backend URL             |
| `JWT_SECRET`   | `preventai-super-secret-key` | Must match auth server       |

---

## 🤖 LLM Fallback

If `LLM_API_KEY` is not set or the API call fails, the backend automatically falls back to **rule-based clinical insights** — the app remains fully functional without any LLM key.

---

## 📊 Model Performance

Trained on the Diabetes Prediction Dataset (100,000 rows):

| Metric    | Class 0 (No Diabetes) | Class 1 (Diabetes) |
|-----------|-----------------------|--------------------|
| Precision | 0.97                  | 0.97               |
| Recall    | 1.00                  | 0.69               |
| F1-score  | 0.98                  | 0.81               |
| **Overall Accuracy** |              | **97%**            |

---

## ⚠️ Disclaimer

This system is a **clinical decision support tool** only.  
All outputs must be reviewed by a qualified healthcare professional.  
It does not replace medical diagnosis or treatment.
