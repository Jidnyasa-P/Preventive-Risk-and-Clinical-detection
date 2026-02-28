"""
PreventAI – Pydantic schemas
Field names use camelCase to match the TypeScript frontend exactly.
FastAPI's alias_generator handles the JSON serialization.
"""
from __future__ import annotations

from typing import List, Literal
from pydantic import BaseModel, Field, field_validator, model_validator


# ──────────────────────────────────────────────
# REQUEST
# ──────────────────────────────────────────────

class PatientData(BaseModel):
    """
    Matches the TypeScript PatientData interface sent from PatientForm.tsx.
    The frontend sends camelCase keys; we keep them here for 1-to-1 mapping.
    """
    gender: Literal["Male", "Female", "Other"]
    age: float
    hypertension: bool          # frontend sends boolean toggle
    heartDisease: bool          # frontend key: heartDisease
    smokingHistory: str         # frontend key: smokingHistory
    bmi: float
    hba1cLevel: float           # frontend key: hba1cLevel  (HbA1c_level in CSV)
    bloodGlucoseLevel: float    # frontend key: bloodGlucoseLevel

    @field_validator("age")
    @classmethod
    def age_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("age must be greater than 0")
        return v

    @field_validator("bmi")
    @classmethod
    def bmi_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("bmi must be greater than 0")
        return v

    @field_validator("smokingHistory")
    @classmethod
    def valid_smoking(cls, v: str) -> str:
        allowed = {"never", "current", "former", "ever", "not current", "No Info"}
        if v not in allowed:
            raise ValueError(f"smokingHistory must be one of {allowed}")
        return v


# ──────────────────────────────────────────────
# RESPONSE – mirror of TypeScript RiskResult
# ──────────────────────────────────────────────

class FeatureImportance(BaseModel):
    feature: str
    importance: float           # percentage 0–100, matches RiskChart display


class DoctorView(BaseModel):
    explanation: str
    diagnosticTests: List[str]
    recommendations: List[str]


class PatientView(BaseModel):
    explanation: str
    lifestyleAdvice: List[str]
    dietSuggestions: List[str]
    exerciseRecommendations: List[str]


class RiskResult(BaseModel):
    """
    Exactly mirrors the TypeScript RiskResult interface so the frontend
    RiskDashboard.tsx can consume it without any transformation.
    """
    riskScore: float                                        # 0–100 percentage
    riskCategory: Literal["Low", "Moderate", "High"]
    featureImportance: List[FeatureImportance]
    doctorView: DoctorView
    patientView: PatientView
    counterfactuals: List[str]


# ──────────────────────────────────────────────
# HEALTH CHECK
# ──────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    llm_provider: str
