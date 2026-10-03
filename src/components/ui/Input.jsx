export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      )}
      <input
        className={`w-full rounded-lg bg-white border text-gray-800 placeholder-gray-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150 ${
          error ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-200'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
