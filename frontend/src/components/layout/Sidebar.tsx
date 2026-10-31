import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Package,
  Layers,
  Percent,
  Receipt,
  FileSpreadsheet,
  FileText,
  CreditCard,
  Scale,
  Activity,
  History,
  Bell,
  Sparkles,
  Rocket,
  CheckCircle2,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isCustomer = user?.role === 'CUSTOMER';
  const isAdmin = user?.role === 'ADMIN';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
      isActive
        ? 'bg-blue-600/15 text-blue-400 font-semibold border-l-2 border-blue-500 rounded-l-none'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
    }`;

  if (isCustomer) {
    return (
      <aside className="w-64 border-r border-slate-800/80 bg-slate-950 p-4 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
        <div className="space-y-6">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-3 mb-2">
              Customer Portal
            </div>
            <nav className="space-y-1">
              <NavLink to="/portal" className={linkClass}>
                <LayoutDashboard className="w-4 h-4 text-blue-400" />
                <span>My Portal Dashboard</span>
              </NavLink>
              <NavLink to="/subscriptions" className={linkClass}>
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>My Subscriptions</span>
              </NavLink>
              <NavLink to="/invoices" className={linkClass}>
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Invoices & PDFs</span>
              </NavLink>
              <NavLink to="/payments" className={linkClass}>
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Payment History</span>
              </NavLink>
            </nav>
          </div>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-400">
          <div className="font-semibold text-slate-200">Customer Mode</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Data isolated to {user?.customer?.companyName || user?.name}.</div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950 p-3 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="space-y-5">
        {/* Hackathon Demo Highlight Card */}
        <NavLink
          to="/demo"
          className="block p-3 rounded-xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-slate-900 border border-amber-500/30 hover:border-amber-400/60 transition-all group shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-amber-400 group-hover:animate-bounce" />
            <span className="text-xs font-bold text-amber-300">Hackathon Walkthrough</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-snug">
            Run the 9-step scenario from PRD with live verification.
          </p>
        </NavLink>

        {/* OVERVIEW */}
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-3 mb-1.5">
            Overview
          </div>
          <nav className="space-y-0.5">
            <NavLink to="/" end className={linkClass}>
              <LayoutDashboard className="w-4 h-4 text-blue-400" />
              <span>Financial Overview</span>
            </NavLink>
          </nav>
        </div>

        {/* SIGNATURE FEATURE: BILLING CONTROL CENTRE */}
        <div>
          <div className="text-[10px] uppercase font-bold text-amber-400/90 tracking-wider px-3 mb-1.5 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Control Center</span>
          </div>
          <nav className="space-y-0.5">
            <NavLink to="/billing-control" className={linkClass}>
              <Activity className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-slate-200">Billing Control Centre</span>
            </NavLink>
            <NavLink to="/billing-runs" className={linkClass}>
              <History className="w-4 h-4 text-slate-400" />
              <span>Billing Run Logs</span>
            </NavLink>
          </nav>
        </div>

        {/* SUBSCRIPTIONS */}
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-3 mb-1.5">
            Subscriptions
          </div>
          <nav className="space-y-0.5">
            <NavLink to="/subscriptions" className={linkClass}>
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Subscriptions</span>
            </NavLink>
            <NavLink to="/quotations" className={linkClass}>
              <FileSpreadsheet className="w-4 h-4 text-sky-400" />
              <span>Quotations</span>
            </NavLink>
          </nav>
        </div>

        {/* BILLING & RECONCILIATION */}
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-3 mb-1.5">
            Billing & Invoices
          </div>
          <nav className="space-y-0.5">
            <NavLink to="/invoices" className={linkClass}>
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Invoices & PDFs</span>
            </NavLink>
            <NavLink to="/payments" className={linkClass}>
              <CreditCard className="w-4 h-4 text-teal-400" />
              <span>Payments & Allocations</span>
            </NavLink>
            <NavLink to="/reconciliation" className={linkClass}>
              <Scale className="w-4 h-4 text-purple-400" />
              <span>Reconciliation</span>
            </NavLink>
          </nav>
        </div>

        {/* CATALOGUE */}
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-3 mb-1.5">
            Catalogue
          </div>
          <nav className="space-y-0.5">
            <NavLink to="/products" className={linkClass}>
              <Package className="w-4 h-4 text-orange-400" />
              <span>Products & Variants</span>
            </NavLink>
            <NavLink to="/plans" className={linkClass}>
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Subscription Plans</span>
            </NavLink>
            <NavLink to="/taxes-discounts" className={linkClass}>
              <Percent className="w-4 h-4 text-rose-400" />
              <span>Taxes & Discounts</span>
            </NavLink>
          </nav>
        </div>

        {/* CUSTOMERS & USERS */}
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-3 mb-1.5">
            Stakeholders
          </div>
          <nav className="space-y-0.5">
            <NavLink to="/customers" className={linkClass}>
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Customer Accounts</span>
            </NavLink>
            {isAdmin && (
              <NavLink to="/staff" className={linkClass}>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Staff Management</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* SYSTEM */}
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-3 mb-1.5">
            System & Audit
          </div>
          <nav className="space-y-0.5">
            {isAdmin && (
              <NavLink to="/audit-logs" className={linkClass}>
                <History className="w-4 h-4 text-slate-400" />
                <span>Audit Logs</span>
              </NavLink>
            )}
            <NavLink to="/intelligence" className={linkClass}>
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>AI Intelligence</span>
            </NavLink>
          </nav>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="pt-4 border-t border-slate-900 mt-4 text-[11px] text-slate-400 flex items-center justify-between">
        <span>LOOPFLOW v1.0</span>
        <span className="flex items-center gap-1 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Engine Live
        </span>
      </div>
    </aside>
  );
};
