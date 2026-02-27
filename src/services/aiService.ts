import { GoogleGenAI, Type } from "@google/genai";
import { PatientData, RiskResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function predictDiabetesRisk(data: PatientData): Promise<RiskResult> {
  const prompt = `
    As a clinical AI model, analyze the following patient data for diabetes risk:
    Gender: ${data.gender}
    Age: ${data.age}
    Hypertension: ${data.hypertension ? 'Yes' : 'No'}
    Heart Disease: ${data.heartDisease ? 'Yes' : 'No'}
    Smoking History: ${data.smokingHistory}
    BMI: ${data.bmi}
    HbA1c Level: ${data.hba1cLevel}
    Blood Glucose Level: ${data.bloodGlucoseLevel}

    Provide a detailed risk assessment in JSON format.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["riskScore", "riskCategory", "featureImportance", "doctorView", "patientView", "counterfactuals"],
        properties: {
          riskScore: { type: Type.NUMBER, description: "Percentage risk from 0 to 100" },
          riskCategory: { type: Type.STRING, enum: ["Low", "Moderate", "High"] },
          featureImportance: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["feature", "importance"],
              properties: {
                feature: { type: Type.STRING },
                importance: { type: Type.NUMBER, description: "Relative importance score" }
              }
            }
          },
          doctorView: {
            type: Type.OBJECT,
            required: ["explanation", "diagnosticTests", "recommendations"],
            properties: {
              explanation: { type: Type.STRING },
              diagnosticTests: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },
          patientView: {
            type: Type.OBJECT,
            required: ["explanation", "lifestyleAdvice", "dietSuggestions", "exerciseRecommendations"],
            properties: {
              explanation: { type: Type.STRING },
              lifestyleAdvice: { type: Type.ARRAY, items: { type: Type.STRING } },
              dietSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              exerciseRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },
          counterfactuals: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}") as RiskResult;
}
