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
  CreditCard,
  Scale,
  Activity,
  History,
  Sparkles,
  PlayCircle,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isCustomer = user?.role === 'CUSTOMER';
  const isAdmin = user?.role === 'ADMIN';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
      isActive
        ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
    }`;

  if (isCustomer) {
    return (
      <aside className="w-56 border-r border-slate-200 bg-white p-3 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
        <div className="space-y-4">
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Customer Portal
            </div>
            <nav className="space-y-1">
              <NavLink to="/portal" className={linkClass}>
                <LayoutDashboard className="w-4 h-4 text-blue-600" />
                <span>My Overview</span>
              </NavLink>
              <NavLink to="/subscriptions" className={linkClass}>
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>My Subscriptions</span>
              </NavLink>
              <NavLink to="/invoices" className={linkClass}>
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Invoices & PDFs</span>
              </NavLink>
              <NavLink to="/payments" className={linkClass}>
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>Payment History</span>
              </NavLink>
            </nav>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
          <div className="font-semibold text-slate-800">Customer Mode</div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
            {user?.customer?.companyName || user?.name}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-60 border-r border-slate-200 bg-white p-3 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="space-y-5">
        {/* SECTION 1: OPERATIONS */}
        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
            Operations
          </div>
          <nav className="space-y-0.5">
            <NavLink to="/" end className={linkClass}>
              <LayoutDashboard className="w-4 h-4 text-blue-600" />
              <span>Financial Overview</span>
            </NavLink>
            <NavLink to="/billing-control" className={linkClass}>
              <Activity className="w-4 h-4 text-amber-600" />
              <span>Billing Engine</span>
            </NavLink>
            <NavLink to="/subscriptions" className={linkClass}>
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Subscriptions</span>
            </NavLink>
            <NavLink to="/quotations" className={linkClass}>
              <FileSpreadsheet className="w-4 h-4 text-sky-600" />
              <span>Quotations</span>
            </NavLink>
          </nav>
        </div>

        {/* SECTION 2: BILLING & RECONCILIATION */}
        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
            Billing & Collections
          </div>
          <nav className="space-y-0.5">
            <NavLink to="/invoices" className={linkClass}>
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Invoices & PDFs</span>
            </NavLink>
            <NavLink to="/payments" className={linkClass}>
              <CreditCard className="w-4 h-4 text-teal-600" />
              <span>Payments</span>
            </NavLink>
            <NavLink to="/reconciliation" className={linkClass}>
              <Scale className="w-4 h-4 text-purple-600" />
              <span>Reconciliation</span>
            </NavLink>
            <NavLink to="/billing-runs" className={linkClass}>
              <History className="w-4 h-4 text-slate-500" />
              <span>Billing Runs</span>
            </NavLink>
          </nav>
        </div>

        {/* SECTION 3: MANAGEMENT */}
        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
            Catalogue & Users
          </div>
          <nav className="space-y-0.5">
            <NavLink to="/products" className={linkClass}>
              <Package className="w-4 h-4 text-orange-600" />
              <span>Products & Variants</span>
            </NavLink>
            <NavLink to="/plans" className={linkClass}>
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Subscription Plans</span>
            </NavLink>
            <NavLink to="/taxes-discounts" className={linkClass}>
              <Percent className="w-4 h-4 text-rose-600" />
              <span>Taxes & Discounts</span>
            </NavLink>
            <NavLink to="/customers" className={linkClass}>
              <Users className="w-4 h-4 text-cyan-600" />
              <span>Customers</span>
            </NavLink>
            {isAdmin && (
              <NavLink to="/staff" className={linkClass}>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Staff Management</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* SECTION 4: DEMO & INTELLIGENCE */}
        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
            Demo & Intelligence
          </div>
          <nav className="space-y-0.5">
            <NavLink to="/demo" className={linkClass}>
              <PlayCircle className="w-4 h-4 text-amber-600" />
              <span>Hackathon Walkthrough</span>
            </NavLink>
            <NavLink to="/intelligence" className={linkClass}>
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>LOOPFLOW Copilot</span>
            </NavLink>
            {isAdmin && (
              <NavLink to="/audit-logs" className={linkClass}>
                <History className="w-4 h-4 text-slate-500" />
                <span>Audit Trail</span>
              </NavLink>
            )}
          </nav>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="pt-3 border-t border-slate-200 mt-4 px-2 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="font-medium">Brightloop OS</span>
        <span className="flex items-center gap-1.5 text-emerald-600 font-semibold text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> v1.0 Live
        </span>
      </div>
    </aside>
  );
};
