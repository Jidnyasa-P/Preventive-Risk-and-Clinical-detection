import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar({ isLoggedIn, user }: { isLoggedIn: boolean, user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === '/';

  const navLinks = [
    { name: 'Predict Risk', href: '/predict' },
    { name: 'History', href: '/history' },
    { name: 'Reports', href: '/reports' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-emerald-500 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                <Activity className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">PreventAI</span>
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            {isLoggedIn && navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.href ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-slate-200">
              {isLoggedIn ? (
                <Link to="/settings" className="flex items-center gap-2 group">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-slate-900">{user?.fullName || 'Doctor'}</p>
                    <p className="text-[10px] text-slate-500">{user?.specialization || 'Clinician'}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs shadow-sm group-hover:scale-105 transition-transform">
                    {(user?.fullName || 'D').split(' ').map((n: any) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium text-slate-500 hover:text-slate-900">
                    Log in
                  </Link>
                  <Link 
                    to="/signup" 
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-500 hover:text-slate-900 p-2"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 py-4 px-4 space-y-2">
          {isLoggedIn && navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-base font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-lg"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            {isLoggedIn ? (
              <Link
                to="/settings"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-base font-medium text-emerald-600 font-bold"
              >
                Settings & Profile
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-base font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-lg"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-base font-medium text-emerald-600 font-bold"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
