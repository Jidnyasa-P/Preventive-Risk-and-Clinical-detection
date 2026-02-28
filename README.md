# PreventAI — Diabetes Risk Clinical Decision Support System
### Praxis 2.0 Submission

> **AI-powered early diabetes risk detection with explainable ML, GenAI clinical insights, interactive charts, PDF reports, and an intelligent chatbot.**

---

## Table of Contents
1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Architecture](#architecture)
4. [Tech Stack](#tech-stack)
5. [Features](#features)
6. [ML + GenAI Integration](#ml--genai-integration)
7. [Setup & Run](#setup--run)
8. [API Reference](#api-reference)
9. [Model Performance](#model-performance)
10. [Assumptions](#assumptions)
11. [Limitations & Ethics](#limitations--ethics)

---

## Problem Statement

Diabetes affects **537 million adults worldwide** (IDF 2021) — and nearly **half remain undiagnosed**. Early detection is critical: catching diabetes or prediabetes before complications develop can reduce the risk of blindness, kidney failure, limb amputation, and cardiovascular disease by up to **58%** through timely lifestyle intervention.

The core challenges:
- **Clinicians are overwhelmed** — GPs average 7–12 minutes per patient consultation
- **Risk assessment is inconsistent** — different clinicians weigh risk factors differently
- **Patient communication is poor** — medical jargon leads to low adherence to lifestyle advice
- **No explainability** — patients and doctors don't know *which* factors drive the risk score

PreventAI addresses all four challenges in a single, unified web platform.

---

## Solution Overview

PreventAI is a full-stack clinical decision support system that:

1. Takes 8 patient parameters (age, BMI, HbA1c, blood glucose, hypertension, heart disease, smoking history, gender)
2. Runs a trained **Random Forest** model to compute a **diabetes risk probability (0–100%)**
3. Uses **SHAP values** to explain exactly which factors contributed most to that score
4. Passes the results to **Google Gemini** to generate personalised clinical insights for both doctors and patients
5. Displays **interactive charts** (gauge, bar, radar, pie, area, stacked bar)
6. Exports a **structured 2-page clinical PDF report** with all findings
7. Provides a **conversational chatbot** with voice input/output for navigation and medical Q&A

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (React SPA)                │
│  PatientForm → RiskDashboard → Reports → Chatbot    │
└────────────────────┬────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
┌─────────────────┐   ┌──────────────────────┐
│  Node.js/Express│   │   Python FastAPI      │
│  Auth Server    │   │   ML + AI Backend     │
│  Port 3000      │   │   Port 8000           │
│                 │   │                       │
│  - Login/Signup │   │  ┌─────────────────┐ │
│  - JWT tokens   │   │  │  Random Forest  │ │
│  - SQLite DB    │   │  │  (sklearn)      │ │
└─────────────────┘   │  └────────┬────────┘ │
                      │           │           │
                      │  ┌────────▼────────┐ │
                      │  │  SHAP Explainer │ │
                      │  │  (TreeExplainer)│ │
                      │  └────────┬────────┘ │
                      │           │           │
                      │  ┌────────▼────────┐ │
                      │  │  Google Gemini  │ │
                      │  │  (GenAI Layer)  │ │
                      │  └─────────────────┘ │
                      └──────────────────────┘
```

### Data Flow

```
Patient Data Input (8 fields)
        │
        ▼
Preprocessing (encode gender/smoking, normalize)
        │
        ▼
Random Forest → P(diabetes) → Risk Score %
        │
        ▼
SHAP TreeExplainer → Feature Importance (top 5)
        │
        ▼
Gemini API → doctorView + patientView + counterfactuals
        │
        ▼
React UI → Charts + PDF Report + Chatbot
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend UI | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Charts | Recharts (AreaChart, BarChart, RadarChart, PieChart) |
| PDF Generation | jsPDF (pure client-side, no server needed) |
| Chatbot | Web Speech API (voice in/out), custom NLP intent engine |
| Auth Server | Node.js, Express, SQLite, JWT, bcrypt |
| ML Backend | Python 3.11, FastAPI, uvicorn |
| ML Model | scikit-learn RandomForestClassifier |
| Explainability | SHAP (TreeExplainer) |
| GenAI Layer | Google Gemini 2.0 Flash (via REST API) |
| Fallback AI | Rule-based clinical guidelines engine |

---

## Features

### Core Features
- **Risk Assessment Form** — 8 validated clinical parameters with real-time input
- **Risk Score Dashboard** — Animated SVG gauge, risk category badge, confidence indicators
- **SHAP Feature Importance** — Bar chart and radar chart showing why the score was computed
- **Doctor View** — Clinical explanation, diagnostic test recommendations, follow-up actions
- **Patient View** — Plain-English explanation, diet, lifestyle, and exercise guidance
- **Risk Reduction Insights** — Counterfactual "what-if" suggestions for modifiable factors

### New Features (Praxis 2.0)
- **PDF Clinical Report** — 2-page structured report with gauge, bar charts, clinical sections, disclaimer
- **Aggregate Reports** — Practice-level statistics with trend charts and KPI cards
- **Interactive Charts** — 6 chart types across dashboard and reports pages
- **AI Chatbot** — Text + voice interface, navigates app, answers 20+ medical questions
- **Patient History** — Stores and displays all past assessments with trend visualization

---

## ML + GenAI Integration

### Machine Learning Pipeline

**Dataset:** Diabetes Prediction Dataset — 100,000 patient records with 8 clinical features and a binary diabetes label (sourced from Kaggle, based on CDC BRFSS data).

**Model:** RandomForestClassifier
- 100 decision trees, balanced class weights to handle 9:1 class imbalance
- Features: gender (encoded), age, hypertension, heart disease, smoking history (encoded), BMI, HbA1c, blood glucose
- Train/test split: 80/20, stratified by label
- **Accuracy: 97%**, F1-score (diabetes class): 0.81

**Explainability — SHAP (SHapley Additive exPlanations):**
- Uses TreeExplainer for efficient exact Shapley values on tree models
- Computes per-patient feature contributions (not global importance)
- Returns absolute SHAP values normalised to 0–100% for display
- Compatible with all SHAP versions (handles 2D and 3D output arrays)

### GenAI Layer — Google Gemini

The SHAP output and patient summary are passed to Gemini with a structured system prompt requiring a specific JSON schema back:

```json
{
  "doctorView": {
    "explanation": "clinical 2-3 sentence summary",
    "diagnosticTests": ["test1", "test2"],
    "recommendations": ["action1", "action2"]
  },
  "patientView": {
    "explanation": "plain English summary",
    "lifestyleAdvice": [...],
    "dietSuggestions": [...],
    "exerciseRecommendations": [...]
  },
  "counterfactuals": ["what-if insight 1", ...]
}
```

**Fallback chain:** If Gemini is unavailable or quota is exceeded, the system automatically falls back to a rule-based clinical guidelines engine that produces medically accurate responses deterministically — the app never fails.

---

## Setup & Run

### Prerequisites
- Python 3.9+
- Node.js 18+

### Windows (PowerShell)

**Terminal 1 — Backend**
```powershell
cd preventai-updated\backend

python -m venv venv
venv\Scripts\Activate.ps1

pip install -r requirements.txt

# Create .env file
copy .env.example .env
# Edit .env and set your LLM_API_KEY

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend**
```powershell
cd preventai-updated\frontend
npm install
npm run dev
```

Open **http://localhost:3000**

### Mac / Linux

**Terminal 1 — Backend**
```bash
cd preventai-updated/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your LLM_API_KEY
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend**
```bash
cd preventai-updated/frontend
npm install
npm run dev
```

### Environment Variables (backend/.env)

```env
LLM_PROVIDER=gemini
LLM_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-2.0-flash
MODEL_PATH=diabetes_model.pkl
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

Get a free Gemini API key at: https://aistudio.google.com/app/apikey

> **Note:** The app works fully without an API key using the built-in rule-based fallback.

---

## API Reference

### POST /predict
Full risk assessment with ML + SHAP + GenAI.

**Request:**
```json
{
  "gender": "Female",
  "age": 52,
  "hypertension": true,
  "heartDisease": false,
  "smokingHistory": "former",
  "bmi": 31.2,
  "hba1cLevel": 6.8,
  "bloodGlucoseLevel": 180
}
```

**Response:** RiskResult object with riskScore, riskCategory, featureImportance, doctorView, patientView, counterfactuals.

### GET /health
Returns model load status and LLM provider.

### POST /predict/quick
ML-only prediction (no SHAP, no LLM) for high-throughput use.

---

## Model Performance

Trained on 100,000 patient records:

| Metric | No Diabetes | Diabetes |
|--------|-------------|----------|
| Precision | 0.97 | 0.97 |
| Recall | 1.00 | 0.69 |
| F1-Score | 0.98 | 0.81 |
| **Overall Accuracy** | | **97%** |

---

## Assumptions

1. Input values are self-reported or from clinical records — no validation against lab ranges is performed server-side
2. The model is trained on CDC BRFSS survey data which may not reflect all global populations equally
3. HbA1c and blood glucose are assumed to be fasting values unless otherwise noted
4. The system assumes binary diabetes classification (diabetic / non-diabetic) — it does not distinguish Type 1 from Type 2
5. GenAI insights are generated fresh per request — they are not cached or personalised across sessions
6. The chatbot intent engine is rule-based (not LLM-powered) and handles ~20 predefined intents

---

## Limitations & Ethics

See DOCUMENTATION.md for full ethical analysis. Key points:

- **Not a diagnostic tool** — outputs must be reviewed by a licensed clinician
- **Dataset bias** — model trained on US CDC data; may underperform for other demographics
- **Class imbalance** — only ~8.5% of training records are diabetic; recall for diabetes class is 69%
- **No longitudinal tracking** — risk is assessed at a point in time, not tracked over time
- **Data privacy** — patient data is stored locally in SQLite; no cloud transmission of clinical data

---

## Project Team

Submitted for **Praxis 2.0** Hackathon
