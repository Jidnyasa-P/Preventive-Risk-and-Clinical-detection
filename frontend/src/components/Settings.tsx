import React, { useState } from 'react';
import { User, Bell, Shield, Globe, CreditCard, LogOut, ChevronRight, Camera, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function Settings({ setIsLoggedIn, user, setUser }: { setIsLoggedIn: (val: boolean) => void, user: any, setUser: (user: any) => void }) {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // User Profile State
  const [profile, setProfile] = useState({
    fullName: user?.fullName || 'Dr. Sarah Smith',
    email: user?.email || 'sarah.smith@preventai.com',
    specialization: user?.specialization || 'Endocrinologist',
    notifications: {
      email: true,
      push: false
    },
    security: {
      twoFactor: true
    }
  });

  const [editMode, setEditMode] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsLoggedIn(false);
      setUser(null);
      navigate('/');
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: profile.fullName,
          specialization: profile.specialization
        }),
      });

      if (res.ok) {
        setUser({ ...user, fullName: profile.fullName, specialization: profile.specialization });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (field: string, current: string) => {
    setEditMode(field);
    setTempValue(current);
  };

  const saveField = () => {
    if (editMode) {
      setProfile(prev => ({ ...prev, [editMode]: tempValue }));
      setEditMode(null);
    }
  };

  const toggleNotification = (type: 'email' | 'push') => {
    setProfile(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Account Settings</h2>
          <p className="text-slate-500">Manage your profile and application preferences</p>
        </div>
        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg"
            >
              <Check className="w-4 h-4" />
              Changes Saved
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        {/* Profile Header */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-emerald-100 border-4 border-white flex items-center justify-center text-3xl font-black text-emerald-700 shadow-xl">
              {profile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <button 
              onClick={() => alert('Profile picture upload coming soon!')}
              className="absolute bottom-0 right-0 p-2 bg-white rounded-full border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <Camera className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">{profile.fullName}</h3>
            <p className="text-slate-500">Member since February 2026</p>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
              Verified Clinician
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="divide-y divide-slate-100">
          {/* Profile Section */}
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 rounded-xl">
                <User className="w-5 h-5 text-slate-600" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Profile Information</h4>
            </div>
            <div className="space-y-6">
              {[
                { id: 'fullName', label: 'Full Name', value: profile.fullName },
                { id: 'email', label: 'Email Address', value: profile.email },
                { id: 'specialization', label: 'Specialization', value: profile.specialization },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                    {editMode === item.id ? (
                      <div className="mt-1 flex items-center gap-2">
                        <input 
                          type="text"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-emerald-500 w-full max-w-xs"
                          autoFocus
                        />
                        <button onClick={saveField} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditMode(null)} className="p-1 text-slate-400 hover:bg-slate-50 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-slate-700 mt-1">{item.value}</p>
                    )}
                  </div>
                  {editMode !== item.id && (
                    <button 
                      onClick={() => startEdit(item.id, item.value)}
                      className="text-xs font-bold text-emerald-600 hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notifications Section */}
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 rounded-xl">
                <Bell className="w-5 h-5 text-slate-600" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Notifications</h4>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-700">Email Alerts</p>
                  <p className="text-xs text-slate-500">Receive risk assessment summaries via email</p>
                </div>
                <button 
                  onClick={() => toggleNotification('email')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${profile.notifications.email ? 'bg-emerald-500' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${profile.notifications.email ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-700">Push Notifications</p>
                  <p className="text-xs text-slate-500">Real-time alerts on your desktop</p>
                </div>
                <button 
                  onClick={() => toggleNotification('push')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${profile.notifications.push ? 'bg-emerald-500' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${profile.notifications.push ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 rounded-xl">
                <Shield className="w-5 h-5 text-slate-600" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Security</h4>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-700">Two-Factor Authentication</p>
                  <p className="text-xs text-slate-500">Add an extra layer of security to your account</p>
                </div>
                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded uppercase tracking-wider border border-emerald-100">
                  Enabled
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-700">Password</p>
                  <p className="text-xs text-slate-500">Last changed 6 months ago</p>
                </div>
                <button 
                  onClick={() => alert('Password reset link sent to your email.')}
                  className="text-xs font-bold text-emerald-600 hover:underline"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
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
            onClick={handleSave}
            disabled={isSaving}
            className={`bg-emerald-600 text-white px-8 py-3 rounded-2xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center gap-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : 'Save Changes'}
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
