import React, { useState } from 'react';
import { PatientData, Gender, SmokingHistory } from '../types';
import { User, Activity, Heart, Cigarette, Scale, Droplets, Thermometer } from 'lucide-react';
import { motion } from 'motion/react';

interface PatientFormProps {
  onSubmit: (data: PatientData) => void;
  isLoading: boolean;
}

export default function PatientForm({ onSubmit, isLoading }: PatientFormProps) {
  const [formData, setFormData] = useState<PatientData>({
    gender: 'Male',
    age: 45,
    hypertension: false,
    heartDisease: false,
    smokingHistory: 'never',
    bmi: 24.5,
    hba1cLevel: 5.5,
    bloodGlucoseLevel: 100,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               type === 'number' ? parseFloat(value) : value
    }));
  };

  const toggleField = (name: keyof PatientData) => {
    setFormData(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-2xl font-bold text-slate-900">Patient Assessment</h2>
          <p className="text-slate-500 mt-1">Enter clinical parameters to predict diabetes risk.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic Info */}
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" /> Basic Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                  <select 
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                  <input 
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Smoking History</label>
                  <select 
                    name="smokingHistory"
                    value={formData.smokingHistory}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  >
                    <option value="never">Never</option>
                    <option value="current">Current</option>
                    <option value="former">Former</option>
                    <option value="ever">Ever</option>
                    <option value="not current">Not Current</option>
                    <option value="No Info">No Information</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Clinical Parameters */}
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" /> Clinical Metrics
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <Scale className="w-3 h-3" /> BMI
                    </label>
                    <input 
                      type="number"
                      step="0.1"
                      name="bmi"
                      value={formData.bmi}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <Thermometer className="w-3 h-3" /> HbA1c
                    </label>
                    <input 
                      type="number"
                      step="0.1"
                      name="hba1cLevel"
                      value={formData.hba1cLevel}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Droplets className="w-3 h-3" /> Blood Glucose (mg/dL)
                  </label>
                  <input 
                    type="number"
                    name="bloodGlucoseLevel"
                    value={formData.bloodGlucoseLevel}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => toggleField('hypertension')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                      formData.hypertension 
                        ? 'bg-red-50 border-red-200 text-red-600' 
                        : 'bg-white border-slate-100 text-slate-500'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span className="text-sm font-medium">Hypertension</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleField('heartDisease')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                      formData.heartDisease 
                        ? 'bg-red-50 border-red-200 text-red-600' 
                        : 'bg-white border-slate-100 text-slate-500'
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                    <span className="text-sm font-medium">Heart Disease</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing Risk...
                </>
              ) : (
                <>
                  <Activity className="w-5 h-5" />
                  Predict Risk
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
