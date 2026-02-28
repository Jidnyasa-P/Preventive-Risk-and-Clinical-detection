"""
PreventAI - ai_service.py
Generates clinical and patient-friendly insights using Google Gemini or OpenAI.

Set environment variables in backend/.env:
    LLM_PROVIDER = gemini   (default) or openai
    LLM_API_KEY  = your API key
    LLM_MODEL    = (optional) override model name
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

# ─────────────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────────────

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()
LLM_API_KEY  = os.getenv("LLM_API_KEY", "")
LLM_MODEL    = os.getenv("LLM_MODEL", "")   # leave blank to auto-select

# Gemini model candidates in preference order (newest / most stable first)
GEMINI_MODEL_CANDIDATES = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-pro",
]

# ─────────────────────────────────────────────────────────────────────────────
# System prompt
# ─────────────────────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """You are a clinical AI assistant specialised in diabetes risk assessment.
Your role is to help clinicians make informed, timely decisions and to communicate
risk findings clearly to patients.

Always respond with ONLY a valid JSON object matching this exact schema:
{
  "doctorView": {
    "explanation": "<clinical explanation string>",
    "diagnosticTests": ["test1", "test2"],
    "recommendations": ["rec1", "rec2"]
  },
  "patientView": {
    "explanation": "<simple patient-friendly explanation>",
    "lifestyleAdvice": ["advice1"],
    "dietSuggestions": ["suggestion1"],
    "exerciseRecommendations": ["recommendation1"]
  },
  "counterfactuals": ["insight1 about what would reduce risk most"]
}

Rules:
- doctorView.explanation: 2-3 sentences, clinical language, mention key biomarkers.
- doctorView.diagnosticTests: 3-5 specific tests relevant to the risk level.
- doctorView.recommendations: 3-5 follow-up actions or referrals.
- patientView.explanation: 2-3 plain-English sentences, no jargon.
- patientView.lifestyleAdvice: 3-4 actionable tips.
- patientView.dietSuggestions: 3-4 specific dietary recommendations.
- patientView.exerciseRecommendations: 3-4 specific exercise activities.
- counterfactuals: 3-4 what-if statements about modifiable risk factors.
- Do NOT include any text outside the JSON object.
"""


def _build_user_message(
    risk_score: float,
    risk_category: str,
    top_features: List[Dict[str, Any]],
    patient_summary: Dict[str, Any],
) -> str:
    feature_lines = "\n".join(
        f"  - {f['feature']}: {f['importance']:.1f}% contribution"
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
  HbA1c Level      : {patient_summary.get('hba1cLevel', patient_summary.get('HbA1c_level'))}%
  Blood Glucose    : {patient_summary.get('bloodGlucoseLevel', patient_summary.get('blood_glucose_level'))} mg/dL
  Hypertension     : {'Yes' if patient_summary.get('hypertension') else 'No'}
  Heart Disease    : {'Yes' if patient_summary.get('heartDisease', patient_summary.get('heart_disease')) else 'No'}
  Smoking History  : {patient_summary.get('smokingHistory', patient_summary.get('smoking_history'))}
  Gender           : {patient_summary.get('gender')}

Generate the structured JSON insights as instructed.
"""


# ─────────────────────────────────────────────────────────────────────────────
# HTTP helper
# ─────────────────────────────────────────────────────────────────────────────

def _post_json(url: str, headers: Dict[str, str], payload: Dict[str, Any]) -> Dict[str, Any]:
    data = json.dumps(payload).encode("utf-8")
    req  = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code}: {body}") from exc


# ─────────────────────────────────────────────────────────────────────────────
# Gemini caller  – tries multiple model names automatically
# ─────────────────────────────────────────────────────────────────────────────

def _call_gemini(user_message: str) -> str:
    """
    Tries GEMINI_MODEL_CANDIDATES in order until one succeeds.
    Uses the v1beta endpoint with responseMimeType=application/json.
    """
    api_key        = LLM_API_KEY
    combined       = f"{_SYSTEM_PROMPT}\n\n{user_message}"
    headers        = {"Content-Type": "application/json"}
    payload        = {
        "contents": [{"parts": [{"text": combined}]}],
        "generationConfig": {
            "temperature": 0.3,
            "responseMimeType": "application/json",
        },
    }

    # Determine candidate list
    candidates = [LLM_MODEL] if LLM_MODEL else GEMINI_MODEL_CANDIDATES

    last_error: Exception | None = None
    for model_id in candidates:
        # Try both v1beta and v1 endpoints
        for api_version in ("v1beta", "v1"):
            url = (
                f"https://generativelanguage.googleapis.com/"
                f"{api_version}/models/{model_id}:generateContent?key={api_key}"
            )
            try:
                logger.info("Trying Gemini model: %s (%s)", model_id, api_version)
                response = _post_json(url, headers, payload)
                text = response["candidates"][0]["content"]["parts"][0]["text"]
                logger.info("Gemini success with model: %s (%s)", model_id, api_version)
                return text
            except RuntimeError as exc:
                err_str = str(exc)
                if "404" in err_str or "NOT_FOUND" in err_str:
                    logger.debug("Model %s not found on %s, trying next.", model_id, api_version)
                    last_error = exc
                    continue
                # Other errors (auth, rate limit, etc.) — raise immediately
                raise
            except Exception as exc:
                last_error = exc
                logger.debug("Error with %s/%s: %s", model_id, api_version, exc)
                continue

    raise RuntimeError(f"All Gemini model candidates failed. Last error: {last_error}")


# ─────────────────────────────────────────────────────────────────────────────
# OpenAI caller
# ─────────────────────────────────────────────────────────────────────────────

def _call_openai(user_message: str) -> str:
    model   = LLM_MODEL or "gpt-4o-mini"
    url     = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type":  "application/json",
        "Authorization": f"Bearer {LLM_API_KEY}",
    }
    payload = {
        "model":           model,
        "temperature":     0.3,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user",   "content": user_message},
        ],
    }
    response = _post_json(url, headers, payload)
    return response["choices"][0]["message"]["content"]


# ─────────────────────────────────────────────────────────────────────────────
# JSON extraction
# ─────────────────────────────────────────────────────────────────────────────

def _extract_json(raw: str) -> Dict[str, Any]:
    cleaned = re.sub(r"```(?:json)?|```", "", raw).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse LLM JSON: %s\nRaw (first 500): %s", exc, raw[:500])
        return _default_response()


# ─────────────────────────────────────────────────────────────────────────────
# Public entry point
# ─────────────────────────────────────────────────────────────────────────────

def generate_ai_insights(
    risk_score: float,
    risk_category: str,
    top_features: List[Dict[str, Any]],
    patient_summary: Dict[str, Any],
) -> Dict[str, Any]:
    if not LLM_API_KEY:
        logger.warning("LLM_API_KEY not set - returning rule-based fallback insights.")
        return _rule_based_fallback(risk_score, risk_category, top_features)

    user_msg = _build_user_message(risk_score, risk_category, top_features, patient_summary)

    try:
        if LLM_PROVIDER == "gemini":
            raw = _call_gemini(user_msg)
        else:
            raw = _call_openai(user_msg)

        parsed = _extract_json(raw)
        return _validate_structure(parsed)

    except Exception as exc:
        logger.error("LLM call failed: %s - using rule-based fallback.", exc)
        return _rule_based_fallback(risk_score, risk_category, top_features)


# ─────────────────────────────────────────────────────────────────────────────
# Validation
# ─────────────────────────────────────────────────────────────────────────────

def _validate_structure(data: Dict[str, Any]) -> Dict[str, Any]:
    default = _default_response()

    def _lst(obj: Any, key: str, fallback: List[str]) -> List[str]:
        val = obj.get(key, fallback) if isinstance(obj, dict) else fallback
        return val if isinstance(val, list) and val else fallback

    dv = data.get("doctorView") or {}
    pv = data.get("patientView") or {}

    return {
        "doctorView": {
            "explanation":    dv.get("explanation")    or default["doctorView"]["explanation"],
            "diagnosticTests":_lst(dv, "diagnosticTests", default["doctorView"]["diagnosticTests"]),
            "recommendations":_lst(dv, "recommendations", default["doctorView"]["recommendations"]),
        },
        "patientView": {
            "explanation":           pv.get("explanation")          or default["patientView"]["explanation"],
            "lifestyleAdvice":       _lst(pv, "lifestyleAdvice",          default["patientView"]["lifestyleAdvice"]),
            "dietSuggestions":       _lst(pv, "dietSuggestions",          default["patientView"]["dietSuggestions"]),
            "exerciseRecommendations":_lst(pv, "exerciseRecommendations", default["patientView"]["exerciseRecommendations"]),
        },
        "counterfactuals": _lst(data, "counterfactuals", default["counterfactuals"]),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Rule-based fallback  (no LLM needed)
# ─────────────────────────────────────────────────────────────────────────────

def _rule_based_fallback(
    risk_score: float,
    risk_category: str,
    top_features: List[Dict[str, Any]],
) -> Dict[str, Any]:
    top_names = [f["feature"] for f in top_features[:3]]
    top_str   = ", ".join(top_names) if top_names else "key biomarkers"

    urgency = {
        "Low":      ("low",      "preventive",                    "routine"),
        "Moderate": ("moderate", "close monitoring and lifestyle", "priority"),
        "High":     ("high",     "immediate clinical",            "urgent"),
    }.get(risk_category, ("unknown", "evaluation", "routine"))

    return {
        "doctorView": {
            "explanation": (
                f"Patient presents a {urgency[0]} diabetes risk score of {risk_score:.0f}%. "
                f"Primary contributing factors are {top_str}. "
                f"Clinical judgement recommends {urgency[1]} intervention at this stage."
            ),
            "diagnosticTests": [
                "Fasting Plasma Glucose (FPG)",
                "HbA1c measurement",
                "Oral Glucose Tolerance Test (OGTT)",
                "Fasting lipid panel (LDL, HDL, triglycerides)",
                "Urine albumin-to-creatinine ratio (ACR)",
            ],
            "recommendations": [
                f"Schedule {urgency[2]} endocrinology or GP follow-up within "
                f"{'2 weeks' if risk_category == 'High' else '3 months'}",
                "Refer to a registered dietitian for medical nutrition therapy",
                "Blood pressure monitoring every 3 months",
                "Annual dilated eye exam and foot examination",
                "Enrol patient in structured diabetes prevention programme if eligible",
            ],
        },
        "patientView": {
            "explanation": (
                f"Based on your health data, you have a {urgency[0]} chance of developing diabetes. "
                "Many of the factors that increase your risk are things you can change. "
                "Making small, consistent improvements to your daily routine can significantly reduce your risk."
            ),
            "lifestyleAdvice": [
                "Aim for 7 to 9 hours of quality sleep each night",
                "Limit alcohol to no more than 1 to 2 units per day",
                "Practise stress management techniques such as deep breathing or meditation",
                "Monitor your blood sugar regularly if advised by your doctor",
            ],
            "dietSuggestions": [
                "Replace sugary drinks and white bread with water and whole-grain alternatives",
                "Fill half your plate with non-starchy vegetables at every meal",
                "Choose lean proteins such as fish, chicken, legumes, or tofu",
                "Avoid ultra-processed snacks and limit saturated fats",
            ],
            "exerciseRecommendations": [
                "30 minutes of brisk walking at least 5 days per week",
                "Light resistance or strength training twice a week",
                "Take a 5 to 10 minute walk after meals to help manage blood glucose",
                "Try low-impact activities such as swimming or cycling if joints are a concern",
            ],
        },
        "counterfactuals": [
            f"Reducing BMI by just 5 to 7 percent could lower your diabetes risk by up to 58 percent",
            f"Keeping HbA1c consistently below 5.7 percent would move you to the low-risk category",
            f"Quitting smoking reduces cardiovascular and metabolic disease risk within 1 to 2 years",
            f"Cutting daily refined carbohydrate intake could reduce your risk score by 10 to 15 percent",
        ],
    }


def _default_response() -> Dict[str, Any]:
    return _rule_based_fallback(50.0, "Moderate", [])
