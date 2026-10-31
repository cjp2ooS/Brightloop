import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Shield, UserCheck, User, LogOut, CheckCircle2, PlayCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout, quickSwitchRole } = useAuth();
  const location = useLocation();

  // Extract a clean display name (e.g., "Victoria Vance" without long title)
  const displayName = user?.name ? user.name.split('(')[0].trim() : 'User';

  return (
    <header className="h-16 shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
      {/* Brand & Mode */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs group-hover:bg-blue-700 transition-colors">
            LF
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 tracking-tight text-base leading-none">LOOPFLOW</span>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-1.5 py-0.5 rounded tracking-wide uppercase">
              Brightloop
            </span>
          </div>
        </Link>

        {/* Demo Fast Switcher Pill */}
        <div className="hidden lg:flex items-center bg-slate-100 border border-slate-200/80 rounded-lg p-0.5 text-xs">
          <span className="text-slate-400 px-2 text-[11px] font-medium">Role:</span>
          <button
            onClick={() => quickSwitchRole('ADMIN')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 text-xs ${
              user?.role === 'ADMIN'
                ? 'bg-white text-blue-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3 h-3 text-blue-600" /> Admin
          </button>
          <button
            onClick={() => quickSwitchRole('STAFF')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 text-xs ${
              user?.role === 'STAFF'
                ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3 h-3 text-indigo-600" /> Staff
          </button>
          <button
            onClick={() => quickSwitchRole('CUSTOMER')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 text-xs ${
              user?.role === 'CUSTOMER'
                ? 'bg-white text-emerald-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3 h-3 text-emerald-600" /> Customer
          </button>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5">
        {/* Hackathon 9-Step Walkthrough Button */}
        <Link
          to="/demo"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-2xs ${
            location.pathname === '/demo'
              ? 'bg-amber-100/80 border-amber-300 text-amber-900'
              : 'bg-amber-50/70 border-amber-200/80 text-amber-800 hover:bg-amber-100/80'
          }`}
        >
          <PlayCircle className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden sm:inline">Hackathon Demo</span>
        </Link>

        {/* AI Assistant */}
        <Link
          to="/intelligence"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-2xs ${
            location.pathname === '/intelligence'
              ? 'bg-blue-100 border-blue-300 text-blue-800'
              : 'bg-blue-50 border-blue-200/80 text-blue-700 hover:bg-blue-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">AI Copilot</span>
        </Link>

        {/* User Info & Logout */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 ml-1">
          <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
              {displayName}
            </div>
            <div className="text-[10px] text-slate-500 font-medium capitalize">
              {user?.role?.toLowerCase()}
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
