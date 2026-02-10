import { Toast, ToastContainer, ToastDescription, ToastTitle } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';

export function AppToaster() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) {
        return null;
    }

    return (
        <ToastContainer>
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    variant={toast.variant}
                    onClose={() => removeToast(toast.id)}
                >
                    {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
                    <ToastDescription>{toast.description}</ToastDescription>
                </Toast>
            ))}
        </ToastContainer>
    );
}
