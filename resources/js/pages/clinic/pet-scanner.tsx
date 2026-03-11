import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
    QrCode,
    Camera,
    CameraOff,
    Search,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard.url() },
    { title: 'Pet Records', href: '/pet-records' },
    { title: 'Scan Pet QR', href: '/pet-records/scan' },
];

export default function PetScanner() {
    const [scanning, setScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<string | null>(null);
    const [manualToken, setManualToken] = useState('');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const { success, error } = useToast();

    const SCANNER_DOM_ID = 'qr-reader';

    const startScanner = async () => {
        setScanError(null);
        setLastResult(null);

        try {
            const scanner = new Html5Qrcode(SCANNER_DOM_ID);
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    // Stop scanning once we get a result
                    scanner.stop().catch(() => {});
                    setScanning(false);
                    setLastResult(decodedText);
                    handleDecodedUrl(decodedText);
                },
                () => {
                    // scan failure — ignore, keep trying
                },
            );

            setScanning(true);
        } catch (err) {
            setScanError('Could not access camera. Please allow camera permission and try again.');
            setScanning(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            await scannerRef.current.stop().catch(() => {});
            scannerRef.current = null;
        }
        setScanning(false);
    };

    // Clean up on unmount
    useEffect(() => {
        return () => {
            scannerRef.current?.stop().catch(() => {});
        };
    }, []);

    const handleDecodedUrl = (url: string) => {
        try {
            const urlObj = new URL(url);
            const parts = urlObj.pathname.split('/').filter(Boolean);
            // Expected path: /scan/{token}
            if (parts.length >= 2 && parts[0] === 'scan') {
                const token = parts[1];
                success('QR code scanned successfully!');
                // Open public pet profile in new tab
                window.open(url, '_blank');
            } else {
                error('QR code does not match a SmartVet pet. Try again.');
            }
        } catch {
            error('Invalid QR code. Please scan a SmartVet pet QR code.');
        }
    };

    const handleManualLookup = () => {
        const token = manualToken.trim();
        if (!token) return;
        window.open(`/scan/${token}`, '_blank');
    };

    return (
        <AdminLayout
            title="Scan Pet QR Code"
            description="Scan a pet's QR code to view their profile and visit history."
            breadcrumbs={breadcrumbs}
        >
            <Head title="Scan Pet QR" />

            <div className="max-w-lg mx-auto space-y-6 py-4">
                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                    <QrCode className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                    <div className="text-sm text-blue-700">
                        <p className="font-medium mb-0.5">How to use</p>
                        <p>Click <strong>Start Camera</strong> and point the camera at a pet's QR code. The pet's public profile will open automatically.</p>
                    </div>
                </div>

                {/* Camera viewer */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                            <Camera className="h-4 w-4" />
                            Camera Scanner
                        </h2>
                        <div className="flex items-center gap-1.5">
                            {scanning && (
                                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Scanning…
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Scanner container — html5-qrcode mounts here */}
                    <div
                        id={SCANNER_DOM_ID}
                        className="w-full bg-slate-900"
                        style={{ minHeight: scanning ? 300 : 0 }}
                    />

                    {!scanning && (
                        <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400">
                            <QrCode className="h-12 w-12 opacity-30" />
                            <p className="text-sm">Camera is off</p>
                        </div>
                    )}

                    <div className="px-5 py-4 flex gap-3">
                        {!scanning ? (
                            <Button className="flex-1 gap-2" onClick={startScanner}>
                                <Camera className="h-4 w-4" />
                                Start Camera
                            </Button>
                        ) : (
                            <Button variant="outline" className="flex-1 gap-2" onClick={stopScanner}>
                                <CameraOff className="h-4 w-4" />
                                Stop Camera
                            </Button>
                        )}
                    </div>
                </div>

                {/* Error */}
                {scanError && (
                    <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-4">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        {scanError}
                    </div>
                )}

                {/* Last result */}
                {lastResult && (
                    <div className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-medium">QR code detected!</p>
                            <p className="text-xs text-emerald-600 mt-0.5 break-all">{lastResult}</p>
                        </div>
                    </div>
                )}

                {/* Manual token lookup */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                        <Search className="h-4 w-4" />
                        Manual Token Lookup
                    </h2>
                    <p className="text-xs text-slate-400">
                        If scanning isn't available, enter the pet's QR token (printed under the QR code on the card) manually.
                    </p>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Paste QR token..."
                            value={manualToken}
                            onChange={(e) => setManualToken(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleManualLookup()}
                            className="font-mono text-sm"
                        />
                        <Button onClick={handleManualLookup} disabled={!manualToken.trim()} className="gap-2 shrink-0">
                            <ExternalLink className="h-4 w-4" />
                            Open
                        </Button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
