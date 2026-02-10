import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export interface ToastMessage {
  id: string
  title?: string
  description: string
  variant?: 'default' | 'destructive' | 'success'
}

interface ToastContextValue {
  toasts: ToastMessage[]
  toast: (message: string | Omit<ToastMessage, 'id'>) => void
  success: (message: string) => void
  error: (message: string) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback(
    (message: string | Omit<ToastMessage, 'id'>) => {
      if (typeof message === 'string') {
        addToast({ description: message })
      } else {
        addToast(message)
      }
    },
    [addToast],
  )

  const success = useCallback(
    (message: string) => {
      addToast({ description: message, variant: 'success' })
    },
    [addToast],
  )

  const error = useCallback(
    (message: string) => {
      addToast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    },
    [addToast],
  )

  const value = useMemo(
    () => ({ toasts, toast, success, error, removeToast }),
    [toasts, toast, success, error, removeToast],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}