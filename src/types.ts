export type Gender = 'Male' | 'Female' | 'Other';
export type SmokingHistory = 'never' | 'current' | 'former' | 'ever' | 'not current' | 'No Info';

export interface PatientData {
  gender: Gender;
  age: number;
  hypertension: boolean;
  heartDisease: boolean;
  smokingHistory: SmokingHistory;
  bmi: number;
  hba1cLevel: number;
  bloodGlucoseLevel: number;
}

export interface RiskResult {
  riskScore: number;
  riskCategory: 'Low' | 'Moderate' | 'High';
  featureImportance: {
    feature: string;
    importance: number;
  }[];
  doctorView: {
    explanation: string;
    diagnosticTests: string[];
    recommendations: string[];
  };
  patientView: {
    explanation: string;
    lifestyleAdvice: string[];
    dietSuggestions: string[];
    exerciseRecommendations: string[];
  };
  counterfactuals: string[];
}
