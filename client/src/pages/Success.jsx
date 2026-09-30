import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { apiError } from '../api/client';
import TopBar from '../components/TopBar.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorState from '../components/ErrorState.jsx';

export default function Success() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [qr, setQr] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    Promise.all([api.get(`/orders/${orderId}`), api.get(`/orders/${orderId}/exit-qr`)])
      .then(([o, q]) => {
        setOrder(o.data.order);
        setQr(q.data.exitQr);
      })
      .catch((err) => setError(apiError(err)));
  };

  useEffect(load, [orderId]);

  const downloadInvoice = () => {
    window.open(`${api.defaults.baseURL}/orders/${orderId}/invoice`, '_blank');
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!order) return <Spinner label="Preparing your bill…" />;

  return (
    <div className="min-h-screen pb-16">
      <TopBar title="Payment successful" />
      <div className="mx-auto max-w-md px-5 py-6">
        <div className="card p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-brandlime">Show this at the exit</p>
          {qr ? <img src={qr} alt="Exit QR code" className="mx-auto mt-3 h-56 w-56" /> : <Spinner label="Generating QR…" />}
          {order.auditRequired && (
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">
              Random audit: the guard will do a full bag check.
            </p>
          )}
          <p className="mt-2 text-xs text-slate-500">Single use · expires after the guard scans it</p>
        </div>

        <div className="card mt-5 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{order.brand?.name}</p>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">{order.status}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {new Date(order.createdAt).toLocaleString('en-IN')} · Payment {order.gatewayPaymentId}
          </p>

          <div className="mt-4 space-y-2 text-sm">
            {order.items.map((i, idx) => (
              <div key={idx} className="flex justify-between gap-3">
                <span className="min-w-0 truncate">{i.name} × {i.qty}</span>
                <span>₹{(i.price * i.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>₹{order.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">GST</span><span>₹{order.gstTotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-base font-bold"><span>Total paid</span><span>₹{order.total.toFixed(2)}</span></div>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <button className="btn-primary" onClick={downloadInvoice}>Download PDF invoice</button>
          <Link to="/orders" className="btn-ghost">My orders</Link>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          Tip: add Self_checkout to your home screen — in Chrome tap ⋮ → “Add to Home screen”, on iPhone tap Share → “Add to Home Screen”.
        </p>
      </div>
    </div>
  );
}
