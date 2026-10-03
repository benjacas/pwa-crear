const variants = {
  primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-card-md disabled:opacity-50',
  secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50',
  danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
  ghost: 'text-primary hover:bg-primary-light',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-sm',
}

export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
