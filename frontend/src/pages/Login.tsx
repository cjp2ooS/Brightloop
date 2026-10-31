import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, UserCheck, User, Lock, Mail, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (role: 'ADMIN' | 'STAFF' | 'CUSTOMER') => {
    if (role === 'ADMIN') {
      setEmail('admin@brightloop.io');
      setPassword('Admin@Brightloop123!');
    } else if (role === 'STAFF') {
      setEmail('sarah.ops@brightloop.io');
      setPassword('Staff@Brightloop123!');
    } else {
      setEmail('alex@acmetech.io');
      setPassword('Customer@Loopflow123!');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 items-center justify-center shadow-xl shadow-blue-500/20">
            <span className="font-black text-white text-xl tracking-tighter">LF</span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">LOOPFLOW</h1>
          <p className="text-xs text-slate-400">Brightloop Intelligent Subscription Management Platform</p>
        </div>

        {/* Quick fill buttons */}
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            1-Click Demo Evaluation Credentials:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('ADMIN')}
              className="py-1.5 px-2 bg-slate-950 border border-slate-800 hover:border-blue-500 rounded text-slate-300 font-medium text-[11px] flex items-center justify-center gap-1"
            >
              <Shield className="w-3 h-3 text-blue-400" /> Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('STAFF')}
              className="py-1.5 px-2 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded text-slate-300 font-medium text-[11px] flex items-center justify-center gap-1"
            >
              <UserCheck className="w-3 h-3 text-indigo-400" /> Staff
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('CUSTOMER')}
              className="py-1.5 px-2 bg-slate-950 border border-slate-800 hover:border-emerald-500 rounded text-slate-300 font-medium text-[11px] flex items-center justify-center gap-1"
            >
              <User className="w-3 h-3 text-emerald-400" /> Customer
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@brightloop.io"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <span>Sign In to LOOPFLOW</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
