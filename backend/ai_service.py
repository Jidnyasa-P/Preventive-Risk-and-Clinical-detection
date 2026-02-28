"""
PreventAI – ai_service.py
Generates clinical and patient-friendly insights using a configurable LLM.

Supported providers (set via LLM_PROVIDER env var):
    • "openai"  – uses OpenAI Chat Completions (default)
    • "gemini"  – uses Google Gemini via the openai-compatible REST endpoint

Both return a structured JSON response that maps directly to the TypeScript
RiskResult.doctorView / patientView / counterfactuals types.
"""
from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Dict, List

import urllib.request
import urllib.error

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai").lower()  # "openai" | "gemini"
LLM_API_KEY  = os.getenv("LLM_API_KEY", "")
LLM_MODEL    = os.getenv(
    "LLM_MODEL",
    "gpt-4o-mini" if LLM_PROVIDER == "openai" else "gemini-1.5-flash",
)

# ──────────────────────────────────────────────
# Prompt builder
# ──────────────────────────────────────────────

_SYSTEM_PROMPT = """You are a clinical AI assistant specialised in diabetes risk assessment.
Your role is to help clinicians make informed, timely decisions and to communicate
risk findings clearly to patients.

Always respond with ONLY a valid JSON object matching this exact schema:
{
  "doctorView": {
    "explanation": "<clinical explanation string>",
    "diagnosticTests": ["test1", "test2", ...],
    "recommendations": ["rec1", "rec2", ...]
  },
  "patientView": {
    "explanation": "<simple patient-friendly explanation>",
    "lifestyleAdvice": ["advice1", ...],
    "dietSuggestions": ["suggestion1", ...],
    "exerciseRecommendations": ["recommendation1", ...]
  },
  "counterfactuals": ["insight1 about what would reduce risk most", ...]
}

Rules:
- doctorView.explanation: 2-3 sentences, clinical language, mention key biomarkers.
- doctorView.diagnosticTests: 3-5 specific tests relevant to the risk level.
- doctorView.recommendations: 3-5 follow-up actions / referrals.
- patientView.explanation: 2-3 plain-English sentences, no jargon.
- patientView.lifestyleAdvice: 3-4 actionable tips.
- patientView.dietSuggestions: 3-4 specific dietary recommendations.
- patientView.exerciseRecommendations: 3-4 specific exercise activities.
- counterfactuals: 3-4 "what-if" statements about modifiable risk factors.
- Do NOT include any text outside the JSON object.
"""


def _build_user_message(
    risk_score: float,
    risk_category: str,
    top_features: List[Dict[str, Any]],
    patient_summary: Dict[str, Any],
) -> str:
    feature_lines = "\n".join(
        f"  • {f['feature']}: {f['importance']:.1f}% contribution"
        for f in top_features
    )
    return f"""
Patient Risk Assessment:
  Risk Score   : {risk_score:.1f}%
  Risk Category: {risk_category}

Top Contributing Features:
{feature_lines}

Patient Clinical Summary:
  Age              : {patient_summary.get('age')}
  BMI              : {patient_summary.get('bmi')}
  HbA1c Level      : {patient_summary.get('hba1cLevel', patient_summary.get('HbA1c_level'))}
  Blood Glucose    : {patient_summary.get('bloodGlucoseLevel', patient_summary.get('blood_glucose_level'))} mg/dL
  Hypertension     : {'Yes' if patient_summary.get('hypertension') else 'No'}
  Heart Disease    : {'Yes' if patient_summary.get('heartDisease', patient_summary.get('heart_disease')) else 'No'}
  Smoking History  : {patient_summary.get('smokingHistory', patient_summary.get('smoking_history'))}
  Gender           : {patient_summary.get('gender')}

Generate the structured JSON insights as instructed.
"""


# ──────────────────────────────────────────────
# HTTP helpers (no external SDK required)
# ──────────────────────────────────────────────

def _post_json(url: str, headers: Dict[str, str], payload: Dict[str, Any]) -> Dict[str, Any]:
    """Minimal HTTP POST using stdlib urllib."""
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"LLM API error {exc.code}: {body}") from exc


def _call_openai(user_message: str) -> str:
    """Calls OpenAI Chat Completions and returns the raw content string."""
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {LLM_API_KEY}",
    }
    payload = {
        "model": LLM_MODEL,
        "temperature": 0.3,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
    }
    response = _post_json(url, headers, payload)
    return response["choices"][0]["message"]["content"]


def _call_gemini(user_message: str) -> str:
    """
    Calls Google Gemini via the Generative Language REST API.
    Uses gemini-1.5-flash by default (set LLM_MODEL to override).
    """
    model_id = LLM_MODEL  # e.g. "gemini-1.5-flash"
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model_id}:generateContent?key={LLM_API_KEY}"
    )
    headers = {"Content-Type": "application/json"}
    combined_prompt = f"{_SYSTEM_PROMPT}\n\n{user_message}"
    payload = {
        "contents": [{"parts": [{"text": combined_prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "responseMimeType": "application/json",
        },
    }
    response = _post_json(url, headers, payload)
    return response["candidates"][0]["content"]["parts"][0]["text"]


# ──────────────────────────────────────────────
# JSON extraction helper
# ──────────────────────────────────────────────

def _extract_json(raw: str) -> Dict[str, Any]:
    """
    Strips markdown fences and parses JSON.
    Falls back to a minimal safe structure if parsing fails.
    """
    cleaned = re.sub(r"```(?:json)?|```", "", raw).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse LLM JSON response: %s\nRaw: %s", exc, raw[:500])
        # Return safe default so the API doesn't 500
        return _default_response()


# ──────────────────────────────────────────────
# Main entry point
# ──────────────────────────────────────────────

def generate_ai_insights(
    risk_score: float,
    risk_category: str,
    top_features: List[Dict[str, Any]],
    patient_summary: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Calls the configured LLM and returns a dict with keys:
        doctorView, patientView, counterfactuals
    matching the TypeScript RiskResult interface.
    """
    if not LLM_API_KEY:
        logger.warning("LLM_API_KEY not set – returning deterministic fallback insights.")
        return _rule_based_fallback(risk_score, risk_category, top_features)

    user_msg = _build_user_message(risk_score, risk_category, top_features, patient_summary)

    try:
        if LLM_PROVIDER == "gemini":
            raw_content = _call_gemini(user_msg)
        else:
            raw_content = _call_openai(user_msg)

        parsed = _extract_json(raw_content)
        return _validate_structure(parsed)

    except Exception as exc:  # noqa: BLE001
        logger.error("LLM call failed: %s – using rule-based fallback.", exc)
        return _rule_based_fallback(risk_score, risk_category, top_features)


# ──────────────────────────────────────────────
# Fallbacks
# ──────────────────────────────────────────────

def _validate_structure(data: Dict[str, Any]) -> Dict[str, Any]:
    """Ensures required keys exist; fills missing ones with defaults."""
    default = _default_response()

    def _get_list(obj: Any, key: str, fallback: List[str]) -> List[str]:
        val = obj.get(key, fallback) if isinstance(obj, dict) else fallback
        return val if isinstance(val, list) else fallback

    dv = data.get("doctorView") or {}
    pv = data.get("patientView") or {}

    return {
        "doctorView": {
            "explanation": dv.get("explanation") or default["doctorView"]["explanation"],
            "diagnosticTests": _get_list(dv, "diagnosticTests", default["doctorView"]["diagnosticTests"]),
            "recommendations": _get_list(dv, "recommendations", default["doctorView"]["recommendations"]),
        },
        "patientView": {
            "explanation": pv.get("explanation") or default["patientView"]["explanation"],
            "lifestyleAdvice": _get_list(pv, "lifestyleAdvice", default["patientView"]["lifestyleAdvice"]),
            "dietSuggestions": _get_list(pv, "dietSuggestions", default["patientView"]["dietSuggestions"]),
            "exerciseRecommendations": _get_list(pv, "exerciseRecommendations", default["patientView"]["exerciseRecommendations"]),
        },
        "counterfactuals": _get_list(data, "counterfactuals", default["counterfactuals"]),
    }


def _rule_based_fallback(
    risk_score: float,
    risk_category: str,
    top_features: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Deterministic clinical guidance produced without an LLM.
    Used when LLM_API_KEY is absent or the API call fails.
    """
    top_names = [f["feature"] for f in top_features[:3]]
    top_str   = ", ".join(top_names) if top_names else "key biomarkers"

    level_text = {
        "Low":      ("low",      "preventive"),
        "Moderate": ("moderate", "close monitoring"),
        "High":     ("high",     "immediate clinical attention"),
    }.get(risk_category, ("unknown", "evaluation"))

    return {
        "doctorView": {
            "explanation": (
                f"Patient presents a {level_text[0]} diabetes risk score of {risk_score:.0f}%. "
                f"Primary contributors include {top_str}. "
                f"Recommend {level_text[1]} based on these findings."
            ),
            "diagnosticTests": [
                "Fasting plasma glucose (FPG)",
                "HbA1c measurement",
                "Oral Glucose Tolerance Test (OGTT)",
                "Fasting lipid panel",
                "Urine albumin-to-creatinine ratio",
            ],
            "recommendations": [
                f"Schedule {'urgent' if risk_category == 'High' else 'routine'} endocrinology follow-up",
                "Lifestyle counselling referral",
                "Blood pressure monitoring every 3 months",
                "Annual eye and foot examinations",
                "Patient education on glycaemic index and nutrition",
            ],
        },
        "patientView": {
            "explanation": (
                f"Your health data suggests a {level_text[0]} chance of developing diabetes. "
                "The good news is that many risk factors are within your control. "
                "Small, consistent changes to your daily habits can make a big difference."
            ),
            "lifestyleAdvice": [
                "Aim for 7–9 hours of quality sleep each night",
                "Limit alcohol consumption",
                "Manage stress with mindfulness or relaxation techniques",
                "Attend regular health check-ups",
            ],
            "dietSuggestions": [
                "Reduce intake of sugary drinks and refined carbohydrates",
                "Increase fibre with vegetables, legumes, and whole grains",
                "Choose lean proteins (fish, chicken, tofu)",
                "Limit saturated fats and processed foods",
            ],
            "exerciseRecommendations": [
                "30 minutes of brisk walking, 5 days per week",
                "Light resistance training twice a week",
                "Take short walking breaks every hour if sedentary",
                "Yoga or stretching for flexibility and stress relief",
            ],
        },
        "counterfactuals": [
            f"Reducing BMI by 5% could lower your risk by ~10%",
            f"Maintaining HbA1c below 5.7% would move you to a lower risk category",
            f"Quitting smoking reduces cardiovascular and metabolic risk significantly",
            f"Cutting daily blood glucose spikes through diet could reduce your score by up to 15%",
        ],
    }


def _default_response() -> Dict[str, Any]:
    return _rule_based_fallback(50.0, "Moderate", [])
