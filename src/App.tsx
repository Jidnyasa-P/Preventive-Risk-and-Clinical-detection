import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import PatientForm from './components/PatientForm';
import RiskDashboard from './components/RiskDashboard';
import PatientHistory from './components/PatientHistory';
import Reports from './components/Reports';
import Settings from './components/Settings';
import { Login, Signup } from './components/Auth';
import { PatientData, RiskResult } from './types';
import { predictDiabetesRisk } from './services/aiService';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';

// Wrapper for pages that need a consistent layout
const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="p-8"
  >
    {children}
  </motion.div>
);

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPredicting, setIsPredicting] = useState(false);
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check auth on mount
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.error("Auth check failed", err);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handlePredict = async (data: PatientData) => {
    setIsPredicting(true);
    setError(null);
    try {
      const result = await predictDiabetesRisk(data);
      setRiskResult(result);
      
      // Save to history
      const saved = localStorage.getItem('preventai_history');
      const history = saved ? JSON.parse(saved) : [];
      const newEntry = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        name: `Patient #${Math.floor(Math.random() * 9000) + 1000}`,
        risk: result.riskScore,
        category: result.riskCategory,
        bmi: data.bmi,
        glucose: data.bloodGlucoseLevel
      };
      localStorage.setItem('preventai_history', JSON.stringify([newEntry, ...history]));
      
      return true; // Success
    } catch (err) {
      console.error(err);
      setError('Failed to analyze risk. Please check your connection and try again.');
      return false;
    } finally {
      setIsPredicting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Initializing PreventAI...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <Navbar isLoggedIn={isLoggedIn} user={user} />
        
        <main>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} setUser={setUser} />} />
              <Route path="/signup" element={<Signup setIsLoggedIn={setIsLoggedIn} setUser={setUser} />} />
              
              <Route path="/predict" element={
                isLoggedIn ? (
                  <PageWrapper>
                    <PredictFlow 
                      onPredict={handlePredict} 
                      isLoading={isPredicting} 
                      riskResult={riskResult} 
                    />
                  </PageWrapper>
                ) : <Navigate to="/login" replace />
              } />
              
              <Route path="/history" element={
                isLoggedIn ? (
                  <PageWrapper>
                    <PatientHistory />
                  </PageWrapper>
                ) : <Navigate to="/login" replace />
              } />
              
              <Route path="/reports" element={
                isLoggedIn ? (
                  <PageWrapper>
                    <Reports />
                  </PageWrapper>
                ) : <Navigate to="/login" replace />
              } />
              
              <Route path="/settings" element={
                isLoggedIn ? (
                  <PageWrapper>
                    <Settings setIsLoggedIn={setIsLoggedIn} user={user} setUser={setUser} />
                  </PageWrapper>
                ) : <Navigate to="/login" replace />
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-8 right-8 bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50"
          >
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">{error}</p>
            <button onClick={() => setError(null)} className="ml-4 text-white/70 hover:text-white font-bold">✕</button>
          </motion.div>
        )}
      </div>
    </Router>
  );
}

// Sub-component to handle the prediction flow state
function PredictFlow({ 
  onPredict, 
  isLoading, 
  riskResult 
}: { 
  onPredict: (data: PatientData) => Promise<boolean>, 
  isLoading: boolean, 
  riskResult: RiskResult | null 
}) {
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = async (data: PatientData) => {
    const success = await onPredict(data);
    if (success) setShowResult(true);
  };

  if (showResult && riskResult) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setShowResult(false)}
          className="text-emerald-600 font-bold text-sm hover:underline flex items-center gap-2"
        >
          ← Back to Assessment
        </button>
        <RiskDashboard result={riskResult} />
      </div>
    );
  }

  return <PatientForm onSubmit={handleSubmit} isLoading={isLoading} />;
}
