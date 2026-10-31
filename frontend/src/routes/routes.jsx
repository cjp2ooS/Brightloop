import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoginPage, SignupPage, ForgotPasswordPage, ResetPasswordPage } from '../modules/auth/AuthPages';
import { StaffPage, CustomersPage } from '../modules/customers/ManagementPages';
import { CustomerHomePage } from '../modules/auth/CustomerHomePage';
import { ProductsPage, ProductDetailPage } from '../modules/products/ProductPages';
import { TaxesPage } from '../modules/taxes/TaxPages';

function Protected({ roles }) {
  const location = useLocation();
  const token = localStorage.getItem('brightloop-token');
  const user = JSON.parse(localStorage.getItem('brightloop-user') || 'null');
  if (!token || !user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'ADMIN' ? '/admin/staff' : '/admin/customers'} replace />;
  return <Outlet />;
}

function HomeRedirect() {
  const user = JSON.parse(localStorage.getItem('brightloop-user') || 'null');
  return <Navigate to={user?.role === 'ADMIN' ? '/admin/staff' : user?.role === 'STAFF' ? '/admin/customers' : user?.role === 'CUSTOMER' ? '/account' : '/login'} replace />;
}

export const routes = [
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { element: <Protected roles={['CUSTOMER']} />, children: [{ path: '/account', element: <CustomerHomePage /> }] },
  { element: <Protected roles={['ADMIN']} />, children: [{ path: '/admin/staff', element: <StaffPage /> }] },
  { element: <Protected roles={['ADMIN', 'STAFF']} />, children: [{ path: '/admin/customers', element: <CustomersPage /> }] },
  { element: <Protected roles={['ADMIN', 'STAFF']} />, children: [
    { path: '/admin/products', element: <ProductsPage /> },
    { path: '/admin/products/:id', element: <ProductDetailPage /> },
    { path: '/admin/taxes', element: <TaxesPage /> },
  ] },
  { path: '/', element: <HomeRedirect /> },
  { path: '*', element: <Navigate to="/login" replace /> },
];
