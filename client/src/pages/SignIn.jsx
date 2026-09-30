import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiError, useAuth } from '../context/AuthContext.jsx';
import TopBar from '../components/TopBar.jsx';

export default function SignIn() {
  const { sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState('details');
  const [form, setForm] = useState({ name: '', phone: '' });
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const submitDetails = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await sendOtp(form.name.trim(), form.phone.trim());
      toast.success(data.devHint || 'OTP sent to your phone');
      setStep('otp');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await verifyOtp(form.phone.trim(), code.trim());
      toast.success('Signed in');
      navigate(location.state?.from || '/brands', { replace: true });
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopBar title="Sign in" back="/" />
      <div className="mx-auto max-w-md px-5 py-8">
        {step === 'details' ? (
          <form onSubmit={submitDetails} className="card space-y-4 p-5">
            <div>
              <h1 className="text-lg font-bold">Your details</h1>
              <p className="text-sm text-slate-500">We only need your name and mobile number.</p>
            </div>
            <div>
              <label className="label" htmlFor="name">Name</label>
              <input id="name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Vijay" required />
            </div>
            <div>
              <label className="label" htmlFor="phone">Mobile number</label>
              <input id="phone" className="input" inputMode="numeric" maxLength={10} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} placeholder="9876543210" required />
            </div>
            <button className="btn-primary w-full" disabled={busy}>{busy ? 'Sending OTP…' : 'Send OTP'}</button>
          </form>
        ) : (
          <form onSubmit={submitOtp} className="card space-y-4 p-5">
            <div>
              <h1 className="text-lg font-bold">Enter the OTP</h1>
              <p className="text-sm text-slate-500">We sent a one-time code to +91 {form.phone}. Please wait a few seconds for the SMS.</p>
            </div>
            <input className="input text-center text-2xl tracking-[0.4em]" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="••••••" required />
            <button className="btn-primary w-full" disabled={busy}>{busy ? 'Verifying…' : 'Verify & continue'}</button>
            <button type="button" className="btn-ghost w-full" onClick={() => setStep('details')}>Change number</button>
          </form>
        )}
      </div>
    </div>
  );
}
