import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import api, { apiError } from '../../api/client.js';
import { useStaff } from '../../context/StaffContext.jsx';

const inr = (n) => `₹${Number(n).toFixed(2)}`;

export default function Guard() {
  const { staff, logout } = useStaff();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);
  const [recent, setRecent] = useState([]);
  const scanner = useRef(null);
  const busy = useRef(false);

  const loadRecent = () => api.get('/guard/recent').then((r) => setRecent(r.data.orders)).catch(() => {});
  useEffect(() => { loadRecent(); }, []);

  useEffect(() => {
    if (!scanning) return;
    const qr = new Html5Qrcode('guard-reader');
    scanner.current = qr;
    qr.start({ facingMode: 'environment' }, { fps: 10, qrbox: 240 }, async (text) => {
      if (busy.current) return;
      busy.current = true;
      try {
        const r = await api.post('/guard/verify', { token: text });
        setOrder(r.data.order); setError('');
      } catch (err) { setError(apiError(err)); setOrder(null); }
      setScanning(false);
      busy.current = false;
    }).catch(() => setError('Camera unavailable — allow camera access and reload.'));
    return () => { qr.isScanning ? qr.stop().then(() => qr.clear()).catch(() => {}) : qr.clear(); };
  }, [scanning]);

  const act = async (kind) => {
    try {
      if (kind === 'exit') await api.post(`/guard/orders/${order.id}/exit`);
      else await api.post(`/guard/orders/${order.id}/flag`, { reason: window.prompt('Reason for flagging?') || 'Mismatch at exit' });
      toast.success(kind === 'exit' ? 'Exit approved — remove tags' : 'Order flagged');
      reset(); loadRecent();
    } catch (err) { toast.error(apiError(err)); }
  };
  const reset = () => { setOrder(null); setError(''); setScanning(true); };

  return (
    <main className="mx-auto min-h-screen max-w-md bg-slate-50 pb-10">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div><p className="font-semibold">Exit check</p><p className="text-xs text-slate-500">{staff?.username}</p></div>
        <button onClick={logout} className="text-xs font-semibold text-slate-500">Sign out</button>
      </header>

      {scanning && (
        <section className="p-4">
          <div id="guard-reader" className="overflow-hidden rounded-2xl bg-black" />
          <p className="mt-3 text-center text-sm text-slate-500">Point the camera at the customer's exit QR</p>
        </section>
      )}

      {error && (
        <section className="m-4 rounded-2xl border-2 border-red-500 bg-red-50 p-5 text-center">
          <p className="text-3xl">✕</p>
          <p className="mt-2 font-bold text-red-700">Do not release</p>
          <p className="mt-1 text-sm text-red-700">{error}</p>
          <button onClick={reset} className="mt-4 w-full rounded-xl bg-brandink py-3 font-semibold text-white">Scan again</button>
        </section>
      )}

      {order && (
        <section className="m-4 rounded-2xl border-2 border-brandlime bg-white p-5">
          <p className="text-center text-3xl text-brandlime">✓</p>
          <p className="text-center font-bold">Paid · {order.brand}</p>
          <p className="text-center text-sm text-slate-500">{order.customer} · {order.phone}</p>
          {order.auditRequired && (
            <p className="mt-3 rounded-lg bg-amber-100 p-2 text-center text-sm font-semibold text-amber-800">Random audit — check every item in the bag</p>
          )}
          <ul className="mt-4 divide-y text-sm">
            {order.items.map((i, k) => (
              <li key={k} className="flex justify-between py-2"><span>{i.qty} × {i.name}{i.size ? ` (${i.size})` : ''}</span><span>{inr(i.price * i.qty)}</span></li>
            ))}
          </ul>
          <p className="mt-2 flex justify-between border-t pt-2 font-bold"><span>Total paid</span><span>{inr(order.total)}</span></p>
          <p className="mt-1 text-sm text-slate-500">{order.items.reduce((s, i) => s + i.qty, 0)} items — count the bag</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button onClick={() => act('flag')} className="rounded-xl border border-red-400 py-3 font-semibold text-red-600">Flag</button>
            <button onClick={() => act('exit')} className="rounded-xl bg-brandlime py-3 font-semibold text-white">Approve exit</button>
          </div>
        </section>
      )}

      <section className="px-4">
        <h2 className="mt-4 text-sm font-semibold text-slate-600">My recent checks</h2>
        <ul className="mt-2 space-y-2">
          {recent.map((o) => (
            <li key={o.id} className="flex justify-between rounded-xl bg-white p-3 text-sm">
              <span>{o.brand} · {inr(o.total)}</span>
              <span className={o.status === 'FLAGGED' ? 'text-red-600' : 'text-brandlime'}>{o.status}</span>
            </li>
          ))}
          {!recent.length && <li className="text-sm text-slate-400">No checks yet.</li>}
        </ul>
      </section>
    </main>
  );
}
