import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, User, ArrowRight, Github } from 'lucide-react';
import { motion } from 'motion/react';

export function Login({ setIsLoggedIn, setUser }: { setIsLoggedIn: (val: boolean) => void, setUser: (user: any) => void }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email');
    const password = formData.get('password');

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsLoggedIn(true);
        setUser(data.user);
        navigate('/predict');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50"
      >
        <div className="text-center mb-8">
          <div className="bg-emerald-500 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-emerald-100">
            <Activity className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 mt-2">Log in to your clinical dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                name="email"
                type="email" 
                required
                placeholder="doctor@hospital.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                name="password"
                type="password" 
                required
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
              <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              Remember me
            </label>
            <a href="#" className="text-emerald-600 font-bold hover:underline">Forgot password?</a>
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? 'Logging in...' : 'Log In'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Don't have an account? <Link to="/signup" className="text-emerald-600 font-bold hover:underline">Sign up</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export function Signup({ setIsLoggedIn, setUser }: { setIsLoggedIn: (val: boolean) => void, setUser: (user: any) => void }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const fullName = formData.get('fullName');
    const email = formData.get('email');
    const password = formData.get('password');

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsLoggedIn(true);
        setUser(data.user);
        navigate('/predict');
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50"
      >
        <div className="text-center mb-8">
          <div className="bg-emerald-500 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-emerald-100">
            <Activity className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
          <p className="text-slate-500 mt-2">Start your clinical risk assessment journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                name="fullName"
                type="text" 
                required
                placeholder="Dr. John Doe"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                name="email"
                type="email" 
                required
                placeholder="doctor@hospital.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                name="password"
                type="password" 
                required
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Already have an account? <Link to="/login" className="text-emerald-600 font-bold hover:underline">Log in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
