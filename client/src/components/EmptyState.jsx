import { Link } from 'react-router-dom';

export default function EmptyState({ title, description, actionLabel, actionTo }) {
  return (
    <div className="card mx-auto max-w-sm p-8 text-center">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-primary mt-5 w-full">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
