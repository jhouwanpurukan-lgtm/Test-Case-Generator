export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div className={`${sizes[size]} border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin ${className}`} />
  );
}

export function LoadingPage({ message = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
      <span className="text-red-500 text-xl flex-shrink-0">⚠</span>
      <div className="flex-1">
        <p className="text-sm text-red-700 font-medium">Error</p>
        <p className="text-sm text-red-600 mt-0.5">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-2 text-xs text-red-700 underline hover:no-underline">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && <Icon size={48} className="text-gray-300 mb-4" />}
      <p className="text-gray-500 font-medium">{title}</p>
      {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
      {action}
    </div>
  );
}

export function MockAiBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-2">
      <span className="text-amber-500">🤖</span>
      <p className="text-xs text-amber-800">
        <strong>Mock Generation Active</strong> — These test cases were generated using a rule-based mock engine, not a real AI model.
        Add your <code className="font-mono bg-amber-100 px-1 rounded">OPENAI_API_KEY</code> in <code className="font-mono bg-amber-100 px-1 rounded">backend/.env</code> to enable real AI generation.
      </p>
    </div>
  );
}

export function RealAiBanner() {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center gap-2">
      <span className="text-emerald-500">✨</span>
      <p className="text-xs text-emerald-800">
        <strong>Real AI Generation Active</strong> — Test cases were generated using your configured AI model.
      </p>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = 'Delete', danger = true }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-fadeIn">
        <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
          <button
            onClick={onConfirm}
            className={danger ? 'btn-danger text-sm' : 'btn-primary text-sm'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
