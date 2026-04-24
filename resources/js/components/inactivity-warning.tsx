import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface InactivityWarningProps {
    open: boolean;
    timeoutSeconds?: number;
    onContinue: () => void;
    onLogout: () => void;
}

/**
 * Dialog shown to user when they're about to be logged out due to inactivity
 * Gives them the option to continue their session or logout
 */
export function InactivityWarning({
    open,
    timeoutSeconds = 30,
    onContinue,
    onLogout,
}: InactivityWarningProps) {
    return (
        <Dialog open={open}>
            <DialogContent>
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <DialogTitle>Session Expiring Soon</DialogTitle>
                    </div>
                    <DialogDescription className="pt-2">
                        Your session will expire due to inactivity in{' '}
                        <span className="font-semibold text-foreground">{timeoutSeconds} seconds</span>.
                        <br />
                        <br />
                        Click "Continue Session" to stay logged in, or you will be automatically logged out.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex gap-2 pt-4">
                    <Button onClick={onLogout} variant="outline" className="flex-1">
                        Logout Now
                    </Button>
                    <Button onClick={onContinue} className="flex-1">
                        Continue Session
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
