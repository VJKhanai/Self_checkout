import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useStaff } from '../../context/StaffContext.jsx';
import { apiError } from '../../api/client.js';

export default function StaffLogin() {
  const { staff, login } = useStaff();
  const navigate = useNavigate();
  const [f, setF] = useState({ username: '', password: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (staff) navigate(staff.role === 'admin' ? '/admin' : '/guard', { replace: true }); }, [staff, navigate]);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await login(f.username, f.password); } catch (err) { toast.error(apiError(err)); } finally { setBusy(false); }
  };
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="text-2xl font-bold">Staff sign in</h1>
      <p className="mt-1 text-sm text-slate-500">For store guards and admins.</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Username" autoComplete="username"
          value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} required />
        <input className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Password" type="password" autoComplete="current-password"
          value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
        <button disabled={busy} className="w-full rounded-xl bg-brandink py-3 font-semibold text-white disabled:opacity-60">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
