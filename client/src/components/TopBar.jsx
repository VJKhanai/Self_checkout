import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useStore } from '../context/StoreContext.jsx';

export default function TopBar({ title, back }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { brand } = useStore();

  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-md items-center gap-3 px-4">
        {back && (
          <button
            onClick={() => navigate(back)}
            aria-label="Go back"
            className="grid h-9 w-9 place-items-center rounded-full border border-ink/10 bg-white/80 text-lg text-ink/70 transition active:scale-90"
          >
            ‹
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{title}</p>
          {brand && (
            <p className="flex items-center gap-1.5 truncate text-xs text-ink/50">
              <span className="h-1.5 w-1.5 rounded-full bg-brandlime" /> {brand.name}
            </p>
          )}
        </div>
        {user ? (
          <button
            onClick={() => logout().then(() => navigate('/'))}
            className="rounded-full border border-ink/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-ink/70"
          >
            Sign out
          </button>
        ) : (
          <Link to="/signin" className="rounded-full bg-brandink px-3 py-1.5 text-xs font-semibold text-white">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
