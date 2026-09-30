import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { apiError } from '../api/client';
import TopBar from '../components/TopBar.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Brands() {
  const navigate = useNavigate();
  const { brand, setBrand } = useStore();
  const { cart, count, clearCart } = useCart();
  const [brands, setBrands] = useState([]);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');

  const load = () => {
    setState('loading');
    api
      .get('/brands')
      .then(({ data }) => {
        setBrands(data.brands);
        setState('ready');
      })
      .catch((err) => {
        setError(apiError(err));
        setState('error');
      });
  };

  useEffect(load, []);

  const choose = async (next) => {
    if (brand && brand._id !== next._id && count > 0) {
      const ok = window.confirm(`Switching to ${next.name} will empty your ${brand.name} cart. Continue?`);
      if (!ok) return;
      try {
        await clearCart();
      } catch (err) {
        return toast.error(apiError(err));
      }
    }
    setBrand({ _id: next._id, name: next.name, logo: next.logo });
    navigate('/scan');
  };

  return (
    <div className="min-h-screen pb-24">
      <TopBar title="Choose your store" back="/" />
      <div className="mx-auto max-w-md px-5 py-6">
        {state === 'loading' && <Spinner label="Loading stores…" />}
        {state === 'error' && <ErrorState message={error} onRetry={load} />}
        {state === 'ready' && brands.length === 0 && (
          <EmptyState title="No stores available" description="Ask the store admin to activate a brand." />
        )}
        {state === 'ready' && brands.length > 0 && (
          <>
            {cart && count > 0 && (
              <p className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                You have {count} item{count > 1 ? 's' : ''} in your {brand?.name} cart.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {brands.map((b) => (
                <button
                  key={b._id}
                  onClick={() => choose(b)}
                  className={`card flex flex-col items-center gap-3 p-4 text-center ${
                    brand?._id === b._id ? 'ring-2 ring-brandlime' : ''
                  }`}
                >
                  <img src={b.logo} alt="" className="h-16 w-16 rounded-xl object-cover" />
                  <span className="text-sm font-semibold">{b.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
