import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { BillingControlCenter } from './pages/BillingControlCenter';
import { Subscriptions } from './pages/Subscriptions';
import { Quotations } from './pages/Quotations';
import { Invoices } from './pages/Invoices';
import { Payments } from './pages/Payments';
import { Reconciliation } from './pages/Reconciliation';
import { Products } from './pages/Products';
import { Plans } from './pages/Plans';
import { TaxesDiscounts } from './pages/TaxesDiscounts';
import { Customers } from './pages/Customers';
import { Staff } from './pages/Staff';
import { AuditLogs } from './pages/AuditLogs';
import { CustomerPortal } from './pages/CustomerPortal';
import { IntelligenceAssistant } from './pages/IntelligenceAssistant';
import { HackathonDemo } from './pages/HackathonDemo';
import { Login } from './pages/Login';

const ProtectedLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 flex flex-col font-sans select-none">
      {/* Fixed Header */}
      <Navbar />

      {/* Main App Body with Locked Split Layout */}
      <div className="flex flex-1 h-[calc(100vh-4rem)] overflow-hidden">
        {/* Pinned Fixed Sidebar */}
        <Sidebar />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden bg-slate-50">
          <Routes>
            {user.role === 'CUSTOMER' ? (
              <>
                <Route path="/" element={<CustomerPortal />} />
                <Route path="/portal" element={<CustomerPortal />} />
                <Route path="/subscriptions" element={<Subscriptions />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="*" element={<Navigate to="/portal" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Dashboard />} />
                <Route path="/billing-control" element={<BillingControlCenter />} />
                <Route path="/billing-runs" element={<BillingControlCenter />} />
                <Route path="/subscriptions" element={<Subscriptions />} />
                <Route path="/quotations" element={<Quotations />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/reconciliation" element={<Reconciliation />} />
                <Route path="/products" element={<Products />} />
                <Route path="/plans" element={<Plans />} />
                <Route path="/taxes-discounts" element={<TaxesDiscounts />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/staff" element={<Staff />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route path="/intelligence" element={<IntelligenceAssistant />} />
                <Route path="/demo" element={<HackathonDemo />} />
                <Route path="/portal" element={<CustomerPortal />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
