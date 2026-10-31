import React, { useState } from 'react';
import { apiRequest } from '../api/client';
import { ShieldCheck, Plus, CheckCircle2 } from 'lucide-react';

export const Staff: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Staff@Brightloop123!');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Operations');
  const [title, setTitle] = useState('Subscription Specialist');
  const [msg, setMsg] = useState<string | null>(null);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/auth/staff', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, department, title }),
      });
      setMsg(`Staff member ${res.staff.name} successfully created!`);
      setEmail('');
      setName('');
    } catch (err: any) {
      alert(`Staff creation error: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Staff Account Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Create and delegate operational staff accounts with restricted administrative permissions.
          </p>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{msg}</span>
        </div>
      )}

      <form onSubmit={handleCreateStaff} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 max-w-xl">
        <h3 className="text-base font-bold text-slate-100">Provision Staff Credentials</h3>
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Rachel Zane"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Work Email *</label>
            <input
              type="email"
              required
              placeholder="rachel.zane@brightloop.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Temporary Password (PRD policy compliant) *</label>
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20"
        >
          Create Staff Account
        </button>
      </form>
    </div>
  );
};
