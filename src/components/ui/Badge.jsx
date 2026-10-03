const COLORS = {
  green:  { cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-400' },
  red:    { cls: 'bg-red-50 text-red-600 ring-1 ring-red-200',             dot: 'bg-red-400' },
  yellow: { cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',       dot: 'bg-amber-400' },
  blue:   { cls: 'bg-primary-light text-primary ring-1 ring-purple-200',   dot: 'bg-primary' },
  gray:   { cls: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',         dot: 'bg-gray-400' },
}

export default function Badge({ children, color = 'gray', dot = false, className = '' }) {
  const { cls, dot: dotColor } = COLORS[color] ?? COLORS.gray
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cls} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />}
      {children}
    </span>
  )
}
