import React from 'react';
import { User, Bell, Shield, Globe, CreditCard, LogOut, ChevronRight, Camera } from 'lucide-react';
import { motion } from 'motion/react';

import { useNavigate } from 'react-router-dom';

export default function Settings({ setIsLoggedIn }: { setIsLoggedIn: (val: boolean) => void }) {
  const navigate = useNavigate();
  
  const handleSignOut = () => {
    setIsLoggedIn(false);
    navigate('/');
  };

  const sections = [
    { 
      title: 'Profile Information', 
      icon: User, 
      items: [
        { label: 'Full Name', value: 'Dr. Sarah Smith' },
        { label: 'Email Address', value: 'sarah.smith@preventai.com' },
        { label: 'Specialization', value: 'Endocrinologist' },
      ]
    },
    { 
      title: 'Security', 
      icon: Shield, 
      items: [
        { label: 'Password', value: '••••••••••••' },
        { label: 'Two-Factor Auth', value: 'Enabled' },
      ]
    },
    { 
      title: 'Notifications', 
      icon: Bell, 
      items: [
        { label: 'Email Alerts', value: 'On' },
        { label: 'Push Notifications', value: 'Off' },
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Account Settings</h2>
        <p className="text-slate-500">Manage your profile and application preferences</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        {/* Profile Header */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-emerald-100 border-4 border-white flex items-center justify-center text-3xl font-black text-emerald-700 shadow-xl">
              SS
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
              <Camera className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Dr. Sarah Smith</h3>
            <p className="text-slate-500">Member since February 2026</p>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
              Verified Clinician
            </div>
          </div>
        </div>

        {/* Settings List */}
        <div className="divide-y divide-slate-100">
          {sections.map((section, i) => (
            <div key={i} className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-slate-100 rounded-xl">
                  <section.icon className="w-5 h-5 text-slate-600" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">{section.title}</h4>
              </div>
              <div className="space-y-4">
                {section.items.map((item, j) => (
                  <div key={j} className="flex items-center justify-between group cursor-pointer p-2 -m-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-medium text-slate-700">{item.value}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-slate-50 flex items-center justify-between">
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          <button 
            onClick={() => alert('Changes saved successfully.')}
            className="bg-emerald-600 text-white px-8 py-3 rounded-2xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>

      <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4 items-start">
        <Shield className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
        <div>
          <h4 className="text-sm font-bold text-amber-900">Security Recommendation</h4>
          <p className="text-sm text-amber-800/80 mt-1 leading-relaxed">
            Your password was last changed 6 months ago. We recommend updating it 
            periodically to maintain the security of patient data.
          </p>
          <button 
            onClick={() => alert('Password update flow initiated.')}
            className="mt-3 text-sm font-bold text-amber-700 hover:underline"
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}
