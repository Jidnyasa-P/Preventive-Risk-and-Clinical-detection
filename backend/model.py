"""
PreventAI – model.py
Handles loading / training the RandomForest model, preprocessing patient data,
and producing risk probability + category.
"""
from __future__ import annotations

import logging
import os
import pickle
from pathlib import Path
from typing import Any, Dict, Tuple

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────

GENDER_MAP: Dict[str, int] = {"Male": 0, "Female": 1, "Other": 2}
SMOKING_MAP: Dict[str, int] = {
    "never": 0,
    "No Info": 1,
    "current": 2,
    "former": 3,
    "ever": 4,
    "not current": 5,
}

# Internal numeric column order fed to the model
FEATURE_COLS = [
    "gender_enc",
    "age",
    "hypertension",
    "heart_disease",
    "smoking_enc",
    "bmi",
    "HbA1c_level",
    "blood_glucose_level",
]

# Human-readable names aligned to FEATURE_COLS (for SHAP / UI display)
FEATURE_DISPLAY_NAMES = [
    "Gender",
    "Age",
    "Hypertension",
    "Heart Disease",
    "Smoking History",
    "BMI",
    "HbA1c Level",
    "Blood Glucose Level",
]

# ──────────────────────────────────────────────
# Model bundle type
# ──────────────────────────────────────────────

ModelBundle = Dict[str, Any]  # {"model": clf, "gender_map": ..., etc.}

# ──────────────────────────────────────────────
# Training (fallback)
# ──────────────────────────────────────────────

def _train_and_save(model_path: str) -> ModelBundle:
    """
    Trains a RandomForestClassifier on the diabetes CSV dataset.
    Called automatically when no .pkl file is found at MODEL_PATH.
    """
    dataset_path = os.getenv("DATASET_PATH", "diabetes_dataset.csv")

    if not Path(dataset_path).exists():
        raise FileNotFoundError(
            f"Neither a pre-trained model ({model_path}) nor the dataset "
            f"({dataset_path}) was found. Provide one of them to start the service."
        )

    logger.info("Training new model from %s …", dataset_path)
    df = pd.read_csv(dataset_path)

    df["gender_enc"] = df["gender"].map(GENDER_MAP).fillna(2).astype(int)
    df["smoking_enc"] = df["smoking_history"].map(SMOKING_MAP).fillna(1).astype(int)

    X = df[FEATURE_COLS]
    y = df["diabetes"]

    X_train, _, y_train, _ = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    clf = RandomForestClassifier(
        n_estimators=100,
        random_state=42,
        n_jobs=-1,
        class_weight="balanced",
    )
    clf.fit(X_train, y_train)
    logger.info("Training complete.")

    bundle: ModelBundle = {
        "model": clf,
        "gender_map": GENDER_MAP,
        "smoking_map": SMOKING_MAP,
        "feature_names": FEATURE_DISPLAY_NAMES,
        "feature_cols": FEATURE_COLS,
    }

    Path(model_path).parent.mkdir(parents=True, exist_ok=True)
    with open(model_path, "wb") as fh:
        pickle.dump(bundle, fh)
    logger.info("Model saved to %s", model_path)

    return bundle


# ──────────────────────────────────────────────
# Loading
# ──────────────────────────────────────────────

def load_model(model_path: str) -> ModelBundle:
    """
    Loads a pickled model bundle from *model_path*.
    If the file does not exist, trains a new model and saves it there.
    """
    path = Path(model_path)
    if path.exists():
        logger.info("Loading pre-trained model from %s", model_path)
        with open(model_path, "rb") as fh:
            bundle: ModelBundle = pickle.load(fh)
        return bundle

    logger.warning("Model file not found at %s – initiating training …", model_path)
    return _train_and_save(model_path)


# ──────────────────────────────────────────────
# Preprocessing
# ──────────────────────────────────────────────

def preprocess(patient: Dict[str, Any], bundle: ModelBundle) -> np.ndarray:
    """
    Converts a dict of raw patient fields (matching PatientData schema)
    into a 2-D numpy array ready for model.predict_proba().

    Note: frontend sends camelCase; this function accepts both camelCase
    and snake_case keys for flexibility.
    """
    g_map: Dict[str, int] = bundle.get("gender_map", GENDER_MAP)
    s_map: Dict[str, int] = bundle.get("smoking_map", SMOKING_MAP)

    # Support both camelCase (frontend) and snake_case (direct API calls)
    gender = patient.get("gender", "Other")
    age = float(patient.get("age", 0))
    hypertension = int(patient.get("hypertension", 0))
    heart_disease = int(
        patient.get("heartDisease", patient.get("heart_disease", 0))
    )
    smoking = patient.get("smokingHistory", patient.get("smoking_history", "No Info"))
    bmi = float(patient.get("bmi", 0))
    hba1c = float(patient.get("hba1cLevel", patient.get("HbA1c_level", 0)))
    glucose = float(
        patient.get("bloodGlucoseLevel", patient.get("blood_glucose_level", 0))
    )

    gender_enc = g_map.get(gender, 2)
    smoking_enc = s_map.get(smoking, 1)

    row = np.array(
        [[gender_enc, age, hypertension, heart_disease, smoking_enc, bmi, hba1c, glucose]],
        dtype=float,
    )
    return row


# ──────────────────────────────────────────────
# Prediction
# ──────────────────────────────────────────────

def predict(patient_dict: Dict[str, Any], bundle: ModelBundle) -> Tuple[float, str]:
    """
    Returns (risk_probability_0_to_1, risk_category).
    risk_category is one of: "Low", "Moderate", "High"
    """
    clf: RandomForestClassifier = bundle["model"]
    X = preprocess(patient_dict, bundle)

    prob: float = float(clf.predict_proba(X)[0][1])  # P(diabetes=1)

    if prob < 0.30:
        category = "Low"
    elif prob <= 0.70:
        category = "Moderate"
    else:
        category = "High"

    return prob, category
