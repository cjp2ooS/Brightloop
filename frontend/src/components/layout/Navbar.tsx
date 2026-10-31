import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Bell, Shield, UserCheck, User, LogOut, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout, quickSwitchRole } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Mode */}
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="font-black text-white text-base tracking-tighter">LF</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-100 tracking-tight text-base leading-none">LOOPFLOW</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Brightloop SaaS OS</span>
          </div>
        </Link>

        {/* Demo Fast Switcher Pill */}
        <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-full p-1 ml-6 text-xs font-medium">
          <span className="text-slate-400 px-2 text-[11px]">Role Switch:</span>
          <button
            onClick={() => quickSwitchRole('ADMIN')}
            className={`px-2.5 py-1 rounded-full transition-all flex items-center gap-1.5 ${
              user?.role === 'ADMIN'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3 h-3" /> Admin
          </button>
          <button
            onClick={() => quickSwitchRole('STAFF')}
            className={`px-2.5 py-1 rounded-full transition-all flex items-center gap-1.5 ${
              user?.role === 'STAFF'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3 h-3" /> Staff
          </button>
          <button
            onClick={() => quickSwitchRole('CUSTOMER')}
            className={`px-2.5 py-1 rounded-full transition-all flex items-center gap-1.5 ${
              user?.role === 'CUSTOMER'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3 h-3" /> Customer
          </button>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Hackathon 9-Step Walkthrough Button */}
        <Link
          to="/demo"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 hover:border-amber-400 text-xs font-semibold transition-all hover:scale-[1.02]"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Hackathon Demo Scenario</span>
        </Link>

        {/* AI Assistant */}
        <Link
          to="/intelligence"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ask LOOPFLOW AI</span>
        </Link>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-200 leading-none">{user?.name}</div>
            <div className="text-[10px] text-slate-400 mt-1 capitalize">{user?.role?.toLowerCase()}</div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
