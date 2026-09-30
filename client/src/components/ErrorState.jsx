export default function ErrorState({ message, onRetry }) {
  return (
    <div className="card mx-auto max-w-sm border-red-200 bg-red-50 p-6 text-center">
      <p className="text-sm font-medium text-red-700">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost mt-4 w-full">
          Try again
        </button>
      )}
    </div>
  );
}
