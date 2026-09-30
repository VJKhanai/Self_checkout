import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { apiError } from '../api/client';
import TopBar from '../components/TopBar.jsx';
import Spinner from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useCart } from '../context/CartContext.jsx';

/** GST lines grouped by rate, mirroring the server-side computation. */
function gstBreakdown(items) {
  const map = new Map();
  items.forEach((i) => map.set(i.gstPercent, (map.get(i.gstPercent) || 0) + i.gstAmount));
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
}

export default function Cart() {
  const { cart, loading, updateQty, removeItem } = useCart();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);

  const pay = async () => {
    setPaying(true);
    try {
      const { data: created } = await api.post('/payments/create-order');
      // Simulated gateway: the server issues a payment id + signature.
      // With real Razorpay, open checkout here and use its callback values.
      const { data: checkout } = await api.post('/payments/simulate', {
        gatewayOrderId: created.gatewayOrder.id,
        outcome: 'success',
      });
      const { data: verified } = await api.post('/payments/verify', checkout);
      toast.success('Payment successful');
      navigate(`/success/${verified.orderId}`, { replace: true });
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setPaying(false);
    }
  };

  if (loading && !cart) return <Spinner label="Loading your cart…" />;

  return (
    <div className="min-h-screen pb-40">
      <TopBar title="Your cart" back="/scan" />
      <div className="mx-auto max-w-md px-5 py-6">
        {!cart || cart.items.length === 0 ? (
          <EmptyState
            title="Your cart is empty"
            description="Scan a product barcode to start your bill."
            actionLabel="Start scanning"
            actionTo="/scan"
          />
        ) : (
          <>
            <div className="space-y-3">
              {cart.items.map((item) => (
                <div key={item.product} className="card flex gap-3 p-3">
                  <img src={item.image} alt="" className="h-20 w-20 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.size ? `Size ${item.size} · ` : ''}₹{item.price.toFixed(2)} · GST {item.gstPercent}%
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <button className="h-8 w-8 rounded-lg border border-slate-200" onClick={() => updateQty(item.product, item.qty - 1).catch((e) => toast.error(apiError(e)))} aria-label="Decrease">−</button>
                      <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                      <button className="h-8 w-8 rounded-lg border border-slate-200" onClick={() => updateQty(item.product, item.qty + 1).catch((e) => toast.error(apiError(e)))} aria-label="Increase">+</button>
                      <button className="ml-auto text-xs font-semibold text-red-600" onClick={() => removeItem(item.product).catch((e) => toast.error(apiError(e)))}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card mt-5 space-y-2 p-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>₹{cart.subtotal.toFixed(2)}</span></div>
              {gstBreakdown(cart.items).map(([rate, amount]) => (
                <div key={rate} className="flex justify-between text-xs text-slate-500">
                  <span>GST @ {rate}%</span>
                  <span>₹{amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold">
                <span>Total</span><span>₹{cart.total.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {cart && cart.items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white p-4">
          <button className="btn-accent mx-auto w-full max-w-md" onClick={pay} disabled={paying}>
            {paying ? 'Processing payment…' : `Pay securely · ₹${cart.total.toFixed(2)}`}
          </button>
        </div>
      )}
    </div>
  );
}
