"""
PreventAI – explain.py
Generates feature-level explanations using SHAP (preferred) or falls back to
the model's built-in feature_importances_ when SHAP is unavailable.

Returns top-N contributing features as a list of dicts:
    [{"feature": "HbA1c Level", "importance": 42.3}, …]
where `importance` is a 0-100 percentage value consumed by RiskChart.tsx.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List

import numpy as np

from model import preprocess, FEATURE_DISPLAY_NAMES

logger = logging.getLogger(__name__)

# Try importing SHAP; fall back gracefully if not installed
try:
    import shap  # type: ignore

    _SHAP_AVAILABLE = True
    logger.info("SHAP is available – using TreeExplainer for explanations.")
except ImportError:
    _SHAP_AVAILABLE = False
    logger.warning(
        "SHAP not installed – falling back to model.feature_importances_. "
        "Install shap for patient-level explanations."
    )

# Module-level explainer cache (initialised once per process)
_explainer_cache: Any = None


def _get_explainer(bundle: Dict[str, Any]) -> Any:
    """Builds (or returns cached) SHAP TreeExplainer."""
    global _explainer_cache
    if _explainer_cache is None and _SHAP_AVAILABLE:
        clf = bundle["model"]
        _explainer_cache = shap.TreeExplainer(clf)
        logger.info("SHAP TreeExplainer initialised.")
    return _explainer_cache


# ──────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────

def get_top_features(
    patient_dict: Dict[str, Any],
    bundle: Dict[str, Any],
    top_n: int = 5,
) -> List[Dict[str, Any]]:
    """
    Compute feature importance for a single patient.

    Returns a list of dicts sorted by |contribution| descending:
        [{"feature": "HbA1c Level", "importance": 42.3}, …]

    `importance` is expressed as a percentage (0–100) for the front-end
    RiskChart component.
    """
    feature_names: List[str] = bundle.get("feature_names", FEATURE_DISPLAY_NAMES)

    if _SHAP_AVAILABLE:
        return _shap_explanation(patient_dict, bundle, feature_names, top_n)
    else:
        return _fallback_explanation(bundle, feature_names, top_n)


# ──────────────────────────────────────────────
# SHAP path
# ──────────────────────────────────────────────

def _shap_explanation(
    patient_dict: Dict[str, Any],
    bundle: Dict[str, Any],
    feature_names: List[str],
    top_n: int,
) -> List[Dict[str, Any]]:
    """Patient-level SHAP values via TreeExplainer."""
    explainer = _get_explainer(bundle)
    X = preprocess(patient_dict, bundle)

    # shap_values shape: (n_outputs, n_samples, n_features)
    # For RandomForest binary classification: index [1] → class=1 (diabetes)
    raw = explainer.shap_values(X)

    if isinstance(raw, list):
        shap_vals = np.abs(raw[1][0])  # absolute contributions, class 1
    else:
        shap_vals = np.abs(raw[0])

    # Normalise to 0-100 percentage
    total = shap_vals.sum() or 1.0
    pct = (shap_vals / total) * 100.0

    ranked = sorted(
        zip(feature_names, pct.tolist()),
        key=lambda x: x[1],
        reverse=True,
    )[:top_n]

    return [{"feature": name, "importance": round(score, 2)} for name, score in ranked]


# ──────────────────────────────────────────────
# Fallback path (global feature importances)
# ──────────────────────────────────────────────

def _fallback_explanation(
    bundle: Dict[str, Any],
    feature_names: List[str],
    top_n: int,
) -> List[Dict[str, Any]]:
    """
    Uses the model's global feature_importances_ (model-level, not patient-level).
    Less precise than SHAP but always available.
    """
    from sklearn.ensemble import RandomForestClassifier  # local import is fine

    clf: RandomForestClassifier = bundle["model"]
    importances = clf.feature_importances_

    total = importances.sum() or 1.0
    pct = (importances / total) * 100.0

    ranked = sorted(
        zip(feature_names, pct.tolist()),
        key=lambda x: x[1],
        reverse=True,
    )[:top_n]

    return [{"feature": name, "importance": round(score, 2)} for name, score in ranked]
