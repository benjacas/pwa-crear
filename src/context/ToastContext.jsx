import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const CONFIG = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-500',
    border: 'border-emerald-200',
  },
  error: {
    icon: XCircle,
    iconClass: 'text-red-500',
    border: 'border-red-200',
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-500',
    border: 'border-blue-200',
  },
}

function ToastItem({ toast, onRemove }) {
  const { icon: Icon, iconClass, border } = CONFIG[toast.type] ?? CONFIG.info
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border bg-white shadow-card-md min-w-[260px] max-w-xs animate-toast ${border}`}>
      <Icon size={16} className={`${iconClass} shrink-0 mt-0.5`} />
      <p className="text-sm text-gray-700 flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 ml-1"
      >
        <X size={13} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 items-end pointer-events-none">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onRemove={remove} />
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
