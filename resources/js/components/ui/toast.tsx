import * as React from "react"
import { cn } from "@/lib/utils"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success'
  onClose?: () => void
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = 'default', onClose, children, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true)

    const handleClose = () => {
      setIsVisible(false)
      setTimeout(() => {
        onClose?.()
      }, 150)
    }

    React.useEffect(() => {
      const timer = setTimeout(() => {
        handleClose()
      }, 5000)

      return () => clearTimeout(timer)
    }, [])

    if (!isVisible) return null

    const getIcon = () => {
      switch (variant) {
        case 'success':
          return <CheckCircle className="h-4 w-4 text-green-600" />
        case 'destructive':
          return <AlertCircle className="h-4 w-4 text-red-600" />
        default:
          return <Info className="h-4 w-4 text-blue-600" />
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "group pointer-events-auto relative flex w-full items-center space-x-2 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all animate-in slide-in-from-bottom-5",
          {
            'border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100': variant === 'default',
            'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-100': variant === 'destructive',
            'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-900/20 dark:text-green-100': variant === 'success'
          },
          className
        )}
        {...props}
      >
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="grid gap-1 flex-1">
          {children}
        </div>
        <button
          onClick={handleClose}
          className="absolute right-2 top-2 rounded-md p-1 text-gray-400 opacity-0 transition-opacity hover:text-gray-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-300 group-hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }
)
Toast.displayName = "Toast"

const ToastTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-sm font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
ToastTitle.displayName = "ToastTitle"

const ToastDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm opacity-90 leading-snug", className)}
    {...props}
  />
))
ToastDescription.displayName = "ToastDescription"

interface ToastContainerProps {
  children: React.ReactNode
}

const ToastContainer: React.FC<ToastContainerProps> = ({ children }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex max-h-screen w-full flex-col-reverse gap-2 md:max-w-[420px]">
      {children}
    </div>
  )
}

export { Toast, ToastTitle, ToastDescription, ToastContainer }