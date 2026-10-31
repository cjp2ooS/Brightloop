import { Link, useNavigate } from 'react-router-dom';

export function CustomerHomePage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('brightloop-user') || 'null');
  const logout = () => { localStorage.removeItem('brightloop-token'); localStorage.removeItem('brightloop-user'); navigate('/login'); };
  return <main className="min-h-screen bg-slate-50"><header className="border-b bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4"><Link to="/account" className="font-bold text-indigo-700">Brightloop</Link><button onClick={logout} className="text-sm text-indigo-700">Sign out</button></div></header><section className="mx-auto max-w-5xl px-6 py-16"><p className="text-sm font-medium text-indigo-700">Customer account</p><h1 className="mt-2 text-3xl font-semibold text-slate-900">Welcome, {user?.name}</h1><p className="mt-3 max-w-xl text-slate-600">Your Brightloop account is ready. Subscription details will appear here when they’re available.</p></section></main>;
}
