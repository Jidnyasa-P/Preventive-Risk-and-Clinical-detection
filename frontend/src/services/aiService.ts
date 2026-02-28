/**
 * PreventAI – aiService.ts
 *
 * Routes all prediction requests through the Python FastAPI backend at
 * VITE_API_URL (default: http://localhost:8000).
 *
 * The backend handles:
 *   • ML inference (RandomForest)
 *   • SHAP explainability
 *   • LLM-generated doctor/patient insights (OpenAI or Gemini – configured server-side)
 *
 * Response shape matches the TypeScript RiskResult interface exactly.
 */

import { PatientData, RiskResult } from '../types';

// In production: /ml proxied by Node server to internal Python FastAPI
// In dev:        point to local Python directly via VITE_API_URL
const API_BASE =
  (import.meta as any).env?.VITE_API_URL ?? '/ml';

export async function predictDiabetesRisk(data: PatientData): Promise<RiskResult> {
  const response = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = `Server error: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail ?? errorMessage;
    } catch {
      // ignore parse errors
    }
    throw new Error(errorMessage);
  }

  const result: RiskResult = await response.json();
  return result;
}

/**
 * Lightweight ML-only prediction – no SHAP, no LLM.
 * Useful for quick batch screening before showing full insights.
 */
export async function predictQuick(
  data: PatientData
): Promise<{ riskScore: number; riskCategory: 'Low' | 'Moderate' | 'High' }> {
  const response = await fetch(`${API_BASE}/predict/quick`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Quick predict failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Health check – returns true if the backend is up and the model is loaded.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, { method: 'GET' });
    if (!response.ok) return false;
    const data = await response.json();
    return data.status === 'ok' && data.model_loaded === true;
  } catch {
    return false;
  }
}
