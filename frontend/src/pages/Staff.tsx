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
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Staff Account Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create and delegate operational staff accounts with restricted administrative permissions (PRD Section 4).
          </p>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      <form onSubmit={handleCreateStaff} className="p-6 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-4 max-w-xl">
        <h3 className="text-base font-bold text-slate-900">Provision Staff Credentials</h3>
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Rachel Zane"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Work Email *</label>
            <input
              type="email"
              required
              placeholder="rachel.zane@brightloop.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Temporary Password (PRD policy compliant) *</label>
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs"
          >
            Create Staff Account
          </button>
        </div>
      </form>
    </div>
  );
};
