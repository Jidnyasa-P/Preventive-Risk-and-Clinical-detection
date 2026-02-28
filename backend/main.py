"""
PreventAI – main.py
FastAPI application entry point.

Endpoints:
  GET  /health           – liveness probe
  POST /predict          – full diabetes risk assessment (ML + SHAP + LLM)
  POST /predict/quick    – ML-only prediction (no LLM, faster)

Run:
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import Any, Dict

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from ai_service import generate_ai_insights
from explain import get_top_features
from model import load_model, predict
from schemas import FeatureImportance, HealthResponse, PatientData, RiskResult

# ──────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s – %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("preventai")

# ──────────────────────────────────────────────
# Config from environment variables
# ──────────────────────────────────────────────
MODEL_PATH   = os.getenv("MODEL_PATH", "diabetes_model.pkl")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai")

# Allowed CORS origins – override in production
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000",
).split(",")

# ──────────────────────────────────────────────
# Global model bundle (loaded once at startup)
# ──────────────────────────────────────────────
_model_bundle: Dict[str, Any] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the ML model once when the server starts."""
    global _model_bundle
    logger.info("Loading ML model from %s …", MODEL_PATH)
    _model_bundle = load_model(MODEL_PATH)
    logger.info("Model ready. SHAP explainer will initialise on first prediction.")
    yield
    logger.info("Shutting down PreventAI backend.")


# ──────────────────────────────────────────────
# FastAPI app
# ──────────────────────────────────────────────
app = FastAPI(
    title="PreventAI – Diabetes Risk Clinical Decision Support",
    description=(
        "Provides diabetes risk scores, SHAP-based explainability, "
        "and LLM-generated clinical / patient insights."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"http://localhost:\d+",  # allow any localhost port in dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# Global exception handler
# ──────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error("Unhandled error on %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal error occurred. Please try again later."},
    )


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check() -> HealthResponse:
    """Returns service health and model load status."""
    return HealthResponse(
        status="ok",
        model_loaded=bool(_model_bundle),
        llm_provider=LLM_PROVIDER,
    )


@app.post("/predict", response_model=RiskResult, tags=["Prediction"])
async def predict_risk(patient: PatientData) -> RiskResult:
    """
    Full diabetes risk assessment:
    1. ML prediction (probability + category)
    2. SHAP explainability (top 5 features)
    3. LLM-generated clinical and patient insights

    Returns a RiskResult matching the TypeScript interface exactly.
    """
    if not _model_bundle:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML model is not loaded. Retry in a moment.",
        )

    # Convert Pydantic model to plain dict for downstream functions
    patient_dict = patient.model_dump()

    # 1 – ML prediction
    logger.info("Running prediction for patient (age=%s, bmi=%s)", patient.age, patient.bmi)
    prob, risk_category = predict(patient_dict, _model_bundle)
    risk_score_pct = round(prob * 100, 1)

    # 2 – SHAP / feature importance
    top_features_raw = get_top_features(patient_dict, _model_bundle, top_n=5)

    # 3 – LLM insights
    ai_output = generate_ai_insights(
        risk_score=risk_score_pct,
        risk_category=risk_category,
        top_features=top_features_raw,
        patient_summary=patient_dict,
    )

    # 4 – Assemble response that matches TypeScript RiskResult exactly
    return RiskResult(
        riskScore=risk_score_pct,
        riskCategory=risk_category,
        featureImportance=[
            FeatureImportance(feature=f["feature"], importance=f["importance"])
            for f in top_features_raw
        ],
        doctorView=ai_output["doctorView"],
        patientView=ai_output["patientView"],
        counterfactuals=ai_output.get("counterfactuals", []),
    )


@app.post("/predict/quick", tags=["Prediction"])
async def predict_quick(patient: PatientData) -> dict:
    """
    Lightweight endpoint – ML prediction only (no SHAP, no LLM).
    Useful for high-throughput batch screening scenarios.
    """
    if not _model_bundle:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML model is not loaded.",
        )

    patient_dict = patient.model_dump()
    prob, risk_category = predict(patient_dict, _model_bundle)

    return {
        "riskScore": round(prob * 100, 1),
        "riskCategory": risk_category,
    }
