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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-xl bg-blue-600 items-center justify-center shadow-xs">
            <span className="font-bold text-white text-xl tracking-tight">LF</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">LOOPFLOW</h1>
          <p className="text-xs text-slate-500">Brightloop Subscription OS & Recurring Billing Platform</p>
        </div>

        {/* Quick fill buttons */}
        <div className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-2 text-xs shadow-2xs">
          <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
            1-Click Demo Evaluation Credentials:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('ADMIN')}
              className="py-1.5 px-2 bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-lg text-slate-700 font-medium text-xs flex items-center justify-center gap-1 transition-all"
            >
              <Shield className="w-3.5 h-3.5 text-blue-600" /> Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('STAFF')}
              className="py-1.5 px-2 bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-lg text-slate-700 font-medium text-xs flex items-center justify-center gap-1 transition-all"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" /> Staff
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('CUSTOMER')}
              className="py-1.5 px-2 bg-slate-50 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 rounded-lg text-slate-700 font-medium text-xs flex items-center justify-center gap-1 transition-all"
            >
              <User className="w-3.5 h-3.5 text-emerald-600" /> Customer
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-white border border-slate-200/80 space-y-4 shadow-sm">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@brightloop.io"
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to LOOPFLOW'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
