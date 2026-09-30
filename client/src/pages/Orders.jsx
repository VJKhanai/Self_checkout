import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { apiError } from '../api/client';
import TopBar from '../components/TopBar.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';

const STATUS_STYLES = {
  PAID: 'bg-blue-100 text-blue-700',
  VERIFIED: 'bg-amber-100 text-amber-800',
  EXITED: 'bg-green-100 text-green-700',
  FLAGGED: 'bg-red-100 text-red-700',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  const [qr, setQr] = useState({ orderId: null, image: '' });

  const load = () => {
    setState('loading');
    api
      .get('/orders')
      .then(({ data }) => {
        setOrders(data.orders);
        setState('ready');
      })
      .catch((err) => {
        setError(apiError(err));
        setState('error');
      });
  };

  useEffect(load, []);

  const showQr = async (orderId) => {
    try {
      const { data } = await api.get(`/orders/${orderId}/exit-qr`);
      setQr({ orderId, image: data.exitQr });
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <TopBar title="My orders" back="/brands" />
      <div className="mx-auto max-w-md px-5 py-6">
        {state === 'loading' && <Spinner label="Loading your orders…" />}
        {state === 'error' && <ErrorState message={error} onRetry={load} />}
        {state === 'ready' && orders.length === 0 && (
          <EmptyState title="No orders yet" description="Your paid bills will appear here." actionLabel="Start shopping" actionTo="/brands" />
        )}
        {state === 'ready' &&
          orders.map((o) => (
            <div key={o._id} className="card mb-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{o.brand?.name}</p>
                  <p className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleString('en-IN')}</p>
                  <p className="mt-1 text-sm font-bold">₹{o.total.toFixed(2)} · {o.items.length} item{o.items.length > 1 ? 's' : ''}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[o.status] || 'bg-slate-100 text-slate-600'}`}>
                  {o.status}
                </span>
              </div>
              <div className="mt-3 flex gap-3">
                <Link to={`/success/${o._id}`} className="btn-ghost flex-1 text-xs">View bill</Link>
                {o.status === 'PAID' && !o.qrUsed && (
                  <button className="btn-primary flex-1 text-xs" onClick={() => showQr(o._id)}>Show exit QR</button>
                )}
              </div>
              {qr.orderId === o._id && qr.image && <img src={qr.image} alt="Exit QR code" className="mx-auto mt-4 h-48 w-48" />}
            </div>
          ))}
      </div>
    </div>
  );
}
