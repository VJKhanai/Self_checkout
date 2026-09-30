import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';

const STEPS = [
  ['1', 'Choose your store', 'Pick the brand you are shopping in.'],
  ['2', 'Scan products', 'Point your camera at the barcode on the tag.'],
  ['3', 'Pay on your phone', 'GST-accurate bill, paid in seconds.'],
  ['4', 'Show QR at exit', 'The guard scans it and removes the tags.'],
];

const BENEFITS = [
  ['No queues', 'Skip the billing counter entirely.'],
  ['Honest totals', 'Prices and GST come straight from the store system.'],
  ['Safe exit', 'A single-use signed QR proves you paid.'],
];

const FAQ = [
  ['Do I need to install an app?', 'No. It runs in your mobile browser; you can add it to your home screen.'],
  ['What if a barcode will not scan?', 'Type the number printed under the barcode using manual entry.'],
  ['Is my card data stored?', 'No. Payment is handled by the gateway and never touches this app.'],
  ['What happens at the exit?', 'The guard scans your QR once. It expires after use.'],
];

export default function Landing() {
  const { user } = useAuth();
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    api
      .get('/brands')
      .then(({ data }) => setBrands(data.brands))
      .catch(() => setBrands([]));
  }, []);

  return (
    <div className="min-h-screen bg-background pb-16 text-foreground">
      {/* Hero */}
      <div className="bg-primary px-5 pb-12 pt-10 text-primary-foreground">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
              Self_checkout
            </p>
            <Link
              to="/staff"
              className="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold backdrop-blur-md transition hover:bg-white/10"
            >
              Staff login
            </Link>
          </div>
          <h1 className="mt-4 text-3xl font-bold leading-tight" data-entrance>
            Scan it. Pay it. Walk out.
          </h1>
          <p className="mt-3 text-sm opacity-80" data-entrance>
            Bill yourself while you shop at Zudio, Nykaa, Westside, Max, DMart and more — then show one QR at the exit.
          </p>
          <div className="mt-6 flex gap-3" data-entrance>
            <Link
              to={user ? '/brands' : '/signin'}
              className="flex-1 rounded-xl bg-white py-3 text-center text-sm font-bold text-primary shadow-lg transition active:scale-95"
            >
              {user ? 'Start shopping' : 'Sign in'}
            </Link>
            {user && (
              <Link
                to="/orders"
                className="flex-1 rounded-xl border border-white/30 py-3 text-center text-sm font-semibold backdrop-blur-md transition hover:bg-white/10"
              >
                My orders
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* How it works */}
      <section className="mx-auto max-w-md px-5 py-8">
        <h2 className="text-lg font-bold">How it works</h2>
        <div className="mt-4 space-y-3">
          {STEPS.map(([n, title, body]) => (
            <div
              key={n}
              data-entrance
              className="flex gap-4 rounded-2xl border border-border bg-surface/70 p-4 shadow-sm backdrop-blur-md"
            >
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary font-mono text-sm font-bold text-primary-foreground">
                {n}
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Brands */}
      <section className="mx-auto max-w-md px-5 pb-8">
        <h2 className="text-lg font-bold">Supported brands</h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {(brands.length ? brands : [{ _id: 'x', name: 'Loading…' }]).map((b) => (
            <div
              key={b._id}
              data-entrance
              className="flex h-20 items-center justify-center rounded-2xl border border-border bg-surface/70 p-2 text-center text-xs font-semibold shadow-sm backdrop-blur-md"
            >
              {b.name}
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-md px-5 pb-8">
        <h2 className="text-lg font-bold">Why shoppers like it</h2>
        <div className="mt-4 space-y-3">
          {BENEFITS.map(([title, body]) => (
            <div
              key={title}
              data-entrance
              className="rounded-2xl border border-border bg-surface/70 p-4 shadow-sm backdrop-blur-md"
            >
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-md px-5 pb-8">
        <h2 className="text-lg font-bold">FAQ</h2>
        <div className="mt-4 space-y-2">
          {FAQ.map(([q, a]) => (
            <details
              key={q}
              data-entrance
              className="rounded-2xl border border-border bg-surface/70 p-4 shadow-sm backdrop-blur-md"
            >
              <summary className="cursor-pointer text-sm font-semibold">{q}</summary>
              <p className="mt-2 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-md px-5 pb-10 text-center text-xs text-muted-foreground">
        Self_checkout · demo build · payments run in test mode ·{' '}
        <Link to="/staff" className="underline">
          Staff login
        </Link>
      </footer>
    </div>
  );
}
