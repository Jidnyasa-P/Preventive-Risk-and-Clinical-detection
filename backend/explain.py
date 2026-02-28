"""
PreventAI - explain.py
Generates feature-level explanations using SHAP (preferred) or falls back to
the model's built-in feature_importances_ when SHAP is unavailable.

Returns top-N contributing features as a list of dicts:
    [{"feature": "HbA1c Level", "importance": 42.3}, ...]
where `importance` is a 0-100 percentage value consumed by RiskChart.tsx.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List

import numpy as np

from model import preprocess, FEATURE_DISPLAY_NAMES

logger = logging.getLogger(__name__)

try:
    import shap  # type: ignore
    _SHAP_AVAILABLE = True
    logger.info("SHAP is available - using TreeExplainer for explanations.")
except ImportError:
    _SHAP_AVAILABLE = False
    logger.warning("SHAP not installed - falling back to model.feature_importances_.")

_explainer_cache: Any = None


def _get_explainer(bundle: Dict[str, Any]) -> Any:
    global _explainer_cache
    if _explainer_cache is None and _SHAP_AVAILABLE:
        clf = bundle["model"]
        _explainer_cache = shap.TreeExplainer(clf)
        logger.info("SHAP TreeExplainer initialised.")
    return _explainer_cache


def get_top_features(
    patient_dict: Dict[str, Any],
    bundle: Dict[str, Any],
    top_n: int = 5,
) -> List[Dict[str, Any]]:
    """
    Compute feature importance for a single patient.
    Returns list of {"feature": str, "importance": float (0-100)} dicts.
    """
    feature_names: List[str] = bundle.get("feature_names", FEATURE_DISPLAY_NAMES)

    if _SHAP_AVAILABLE:
        try:
            return _shap_explanation(patient_dict, bundle, feature_names, top_n)
        except Exception as exc:
            logger.warning("SHAP explanation failed (%s) - using fallback.", exc)

    return _fallback_explanation(bundle, feature_names, top_n)


def _shap_explanation(
    patient_dict: Dict[str, Any],
    bundle: Dict[str, Any],
    feature_names: List[str],
    top_n: int,
) -> List[Dict[str, Any]]:
    """Patient-level SHAP values via TreeExplainer - handles all SHAP versions."""
    explainer = _get_explainer(bundle)
    X = preprocess(patient_dict, bundle)
    raw = explainer.shap_values(X)

    # --- Normalise raw SHAP output to 1-D array of per-feature importances ---
    # SHAP can return:
    #   list of arrays  -> [class0_array, class1_array], each shape (1, n_features)
    #   3-D ndarray     -> shape (1, n_features, n_classes)
    #   2-D ndarray     -> shape (1, n_features)
    #   1-D ndarray     -> shape (n_features,)

    if isinstance(raw, list):
        # Old SHAP: list[class] where each element is (n_samples, n_features)
        # Pick class=1 (diabetes positive)
        arr = np.asarray(raw[1], dtype=float)
        shap_vals = np.abs(arr).ravel()
    else:
        arr = np.asarray(raw, dtype=float)
        if arr.ndim == 3:
            # New SHAP: (n_samples, n_features, n_classes) - take class 1
            shap_vals = np.abs(arr[0, :, 1])
        elif arr.ndim == 2:
            # (n_samples, n_features)
            shap_vals = np.abs(arr[0])
        else:
            shap_vals = np.abs(arr.ravel())

    # Guarantee 1 scalar per feature
    n_features = len(feature_names)
    shap_vals = shap_vals.ravel().astype(float)
    if shap_vals.size < n_features:
        shap_vals = np.pad(shap_vals, (0, n_features - shap_vals.size))
    elif shap_vals.size > n_features:
        shap_vals = shap_vals[:n_features]

    # Normalise to 0-100 %
    total = float(shap_vals.sum()) or 1.0
    pct = (shap_vals / total) * 100.0

    ranked = sorted(
        zip(feature_names, pct.tolist()),
        key=lambda x: x[1],
        reverse=True,
    )[:top_n]

    return [
        {"feature": str(name), "importance": round(float(score), 2)}
        for name, score in ranked
    ]


def _fallback_explanation(
    bundle: Dict[str, Any],
    feature_names: List[str],
    top_n: int,
) -> List[Dict[str, Any]]:
    """Global feature importances from the RandomForest model."""
    from sklearn.ensemble import RandomForestClassifier
    clf: RandomForestClassifier = bundle["model"]
    importances = np.asarray(clf.feature_importances_, dtype=float).ravel()

    total = float(importances.sum()) or 1.0
    pct = (importances / total) * 100.0

    ranked = sorted(
        zip(feature_names, pct.tolist()),
        key=lambda x: x[1],
        reverse=True,
    )[:top_n]

    return [
        {"feature": str(name), "importance": round(float(score), 2)}
        for name, score in ranked
    ]
