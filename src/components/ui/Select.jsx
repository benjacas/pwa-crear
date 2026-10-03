export default function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      )}
      <select
        className={`w-full rounded-lg bg-white border text-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150 ${
          error ? 'border-red-300' : 'border-gray-200'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
