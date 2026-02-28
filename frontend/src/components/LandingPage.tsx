import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Shield, Zap, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-50 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold mb-8"
            >
              <Zap className="w-4 h-4" />
              AI-Powered Clinical Decision Support
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6"
            >
              Predict Diabetes Risk with <span className="text-emerald-600">Precision AI</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-500 mb-10 leading-relaxed"
            >
              PreventAI helps clinicians identify early-stage diabetes risk using advanced machine learning, 
              providing actionable insights for both doctors and patients.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                to="/predict"
                className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-2"
              >
                Start Risk Assessment
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/signup"
                className="w-full sm:w-auto bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-2xl text-lg font-bold hover:bg-slate-50 transition-all"
              >
                Create Free Account
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Built for Modern Healthcare</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Our platform combines clinical expertise with cutting-edge AI to deliver 
              unparalleled accuracy in diabetes risk prediction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'High Accuracy AI',
                desc: 'Trained on diverse clinical datasets to ensure reliable risk stratification.',
                icon: Shield,
                color: 'bg-blue-500'
              },
              {
                title: 'Dual-View Insights',
                desc: 'Tailored reports for both medical professionals and patient lifestyle management.',
                icon: Users,
                color: 'bg-emerald-500'
              },
              {
                title: 'Actionable Guidance',
                desc: 'Beyond scores: get specific recommendations for tests, diet, and exercise.',
                icon: Zap,
                color: 'bg-amber-500'
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 hover:shadow-xl transition-all group">
                <div className={`${feature.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-emerald-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full -mr-32 -mt-32 opacity-50" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">Ready to transform your practice?</h2>
              <p className="text-emerald-100 text-lg mb-12 max-w-2xl mx-auto">
                Join thousands of healthcare providers using PreventAI to improve patient outcomes 
                through early intervention and data-driven care.
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-white text-emerald-900 px-10 py-4 rounded-2xl text-lg font-bold hover:bg-emerald-50 transition-all"
              >
                Get Started Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Activity className="text-emerald-600 w-6 h-6" />
            <span className="text-xl font-bold text-slate-900">PreventAI</span>
          </div>
          <div className="flex gap-8 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-900">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900">Terms of Service</a>
            <a href="#" className="hover:text-slate-900">Contact Support</a>
          </div>
          <p className="text-sm text-slate-400">© 2026 PreventAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
