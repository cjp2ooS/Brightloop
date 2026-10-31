import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi, passwordRules } from './api';

function PasswordChecklist({ value }) {
  return <ul className="grid grid-cols-2 gap-2 text-xs">{passwordRules.map(([key, label, check]) => <li key={key} className={check(value) ? 'text-emerald-600' : 'text-slate-400'}>{check(value) ? '✓' : '○'} {label}</li>)}</ul>;
}

function AuthShell({ title, subtitle, children }) {
  return <main className="min-h-screen bg-slate-50 px-4 py-12"><section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><Link to="/login" className="text-sm font-bold text-indigo-700">Brightloop</Link><h1 className="mt-7 text-2xl font-semibold text-slate-900">{title}</h1><p className="mt-1 text-sm text-slate-500">{subtitle}</p>{children}</section></main>;
}

function ErrorText({ children }) { return children ? <p role="alert" className="text-sm text-rose-600">{children}</p> : null; }
function getError(error) { return error.response?.data?.error?.message || error.message || 'Something went wrong'; }

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' }); const [error, setError] = useState(''); const navigate = useNavigate();
  const submit = async (event) => { event.preventDefault(); setError(''); try { const { data } = await authApi.login(form); localStorage.setItem('brightloop-token', data.token); localStorage.setItem('brightloop-user', JSON.stringify(data.user)); navigate(data.user.role === 'ADMIN' ? '/admin/staff' : data.user.role === 'STAFF' ? '/admin/customers' : '/account'); } catch (e) { setError(getError(e)); } };
  return <AuthShell title="Welcome back" subtitle="Sign in to your Brightloop account."><form onSubmit={submit} className="mt-7 space-y-4"><label className="field-label">Email<input className="field-input" type="email" autoComplete="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label><label className="field-label">Password<input className="field-input" type="password" autoComplete="current-password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label><ErrorText>{error}</ErrorText><button className="primary-button w-full">Sign in</button></form><p className="mt-5 flex justify-between text-sm"><Link to="/forgot-password" className="text-indigo-700">Forgot password?</Link><Link to="/signup" className="text-indigo-700">Create account</Link></p></AuthShell>;
}

export function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' }); const [error, setError] = useState(''); const navigate = useNavigate();
  const submit = async (event) => { event.preventDefault(); setError(''); try { const { data } = await authApi.signup(form); localStorage.setItem('brightloop-token', data.token); localStorage.setItem('brightloop-user', JSON.stringify(data.user)); navigate('/account'); } catch (e) { setError(getError(e)); } };
  return <AuthShell title="Create your account" subtitle="Start managing your software subscriptions."><form onSubmit={submit} className="mt-7 space-y-4"><label className="field-label">Full name<input className="field-input" autoComplete="name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label><label className="field-label">Email<input className="field-input" type="email" autoComplete="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label><label className="field-label">Password<input className="field-input" type="password" autoComplete="new-password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label><PasswordChecklist value={form.password} /><ErrorText>{error}</ErrorText><button className="primary-button w-full">Create account</button></form><p className="mt-5 text-sm text-slate-500">Already registered? <Link to="/login" className="text-indigo-700">Sign in</Link></p></AuthShell>;
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState(''); const [done, setDone] = useState(false); const [error, setError] = useState('');
  const submit = async (event) => { event.preventDefault(); setError(''); try { await authApi.forgot({ email }); setDone(true); } catch (e) { setError(getError(e)); } };
  return <AuthShell title="Reset your password" subtitle="We’ll email a reset link if an account matches.">{done ? <p className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">If an account exists for this email, a password reset link has been sent.</p> : <form onSubmit={submit} className="mt-7 space-y-4"><label className="field-label">Email<input className="field-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label><ErrorText>{error}</ErrorText><button className="primary-button w-full">Send reset link</button></form>}<Link to="/login" className="mt-5 inline-block text-sm text-indigo-700">Back to sign in</Link></AuthShell>;
}

export function ResetPasswordPage() {
  const [params] = useSearchParams(); const [password, setPassword] = useState(''); const [done, setDone] = useState(false); const [error, setError] = useState('');
  const submit = async (event) => { event.preventDefault(); setError(''); try { await authApi.reset({ token: params.get('token') || '', password }); setDone(true); } catch (e) { setError(getError(e)); } };
  return <AuthShell title="Choose a new password" subtitle="Use a strong password you haven’t used before.">{done ? <div className="mt-6"><p className="text-sm text-emerald-700">Password updated. You can now sign in.</p><Link to="/login" className="mt-4 inline-block text-sm text-indigo-700">Go to sign in</Link></div> : <form onSubmit={submit} className="mt-7 space-y-4"><label className="field-label">New password<input className="field-input" type="password" autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)} /></label><PasswordChecklist value={password} /><ErrorText>{error}</ErrorText><button className="primary-button w-full">Update password</button></form>}</AuthShell>;
}
