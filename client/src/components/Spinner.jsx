export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-slate-500">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-brandink" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
