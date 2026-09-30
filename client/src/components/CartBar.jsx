import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useCart } from '../context/CartContext.jsx';

export default function CartBar() {
  const { cart, count } = useCart();
  const badge = useRef(null);

  // Little "pop" on the badge whenever an item is added
  useEffect(() => {
    if (!badge.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(badge.current, { scale: 1.5 }, { scale: 1, duration: 0.45, ease: 'back.out(3)' });
  }, [count]);

  if (!cart || count === 0) return null;

  return (
    <Link
      to="/cart"
      className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-md items-center justify-between rounded-2xl bg-ink/90 px-4 py-3.5 text-white shadow-glass backdrop-blur-xl"
      style={{ paddingBottom: 'calc(0.875rem + env(safe-area-inset-bottom))' }}
    >
      <span className="flex items-center gap-3">
        <span ref={badge} className="grid h-8 min-w-8 place-items-center rounded-full bg-brandink px-2 font-mono text-sm font-semibold">
          {count}
        </span>
        <span className="text-sm">
          item{count > 1 ? 's' : ''} · <span className="font-mono font-semibold">₹{cart.total.toFixed(2)}</span>
        </span>
      </span>
      <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">View cart →</span>
    </Link>
  );
}
