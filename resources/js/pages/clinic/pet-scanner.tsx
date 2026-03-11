import { Head, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
    QrCode,
    Camera,
    CameraOff,
    Search,
    AlertCircle,
    CheckCircle2,
    X,
    User,
    Syringe,
    FileText,
    PawPrint,
    Phone,
    Mail,
    Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard.url() },
    { title: 'Pet Records', href: '/pet-records' },
    { title: 'Scan Pet QR', href: '/pet-records/scan' },
];

interface PetResult {
    pet: {
        name: string;
        species: string;
        breed: string;
        age: number | null;
        gender: string;
        color: string | null;
        microchipId: string | null;
        imageUrl: string | null;
        status: string;
        publicUrl: string;
        manageUrl: string;
    };
    owner: { name: string; phone: string; email: string | null };
    vaccinations: { vaccine: string; date: string; nextDue: string }[];
    consultations: { type: string; date: string; complaint: string | null; diagnosis: string | null }[];
}

const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });

export default function PetScanner() {
    const { auth } = usePage<SharedData>().props;
    const themeColor = (auth.user as { theme_color?: string })?.theme_color || '#0f172a';

    const [scanning, setScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [manualToken, setManualToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PetResult | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const { success, error } = useToast();

    const SCANNER_DOM_ID = 'qr-reader';

    const startScanner = async () => {
        setScanError(null);
        try {
            const scanner = new Html5Qrcode(SCANNER_DOM_ID);
            scannerRef.current = scanner;
            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    scanner.stop().catch(() => {});
                    setScanning(false);
                    handleDecodedUrl(decodedText);
                },
                () => {},
            );
            setScanning(true);
        } catch {
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

    useEffect(() => {
        return () => { scannerRef.current?.stop().catch(() => {}); };
    }, []);

    const fetchPet = async (token: string) => {
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch(`/pet-records/scan-lookup/${token}`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!res.ok) {
                error(res.status === 404 ? 'No SmartVet pet found for this QR code.' : 'Failed to load pet data.');
                return;
            }
            const data: PetResult = await res.json();
            setResult(data);
            success('Pet found!');
        } catch {
            error('Could not reach the server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDecodedUrl = (url: string) => {
        try {
            const parts = new URL(url).pathname.split('/').filter(Boolean);
            if (parts.length >= 2 && parts[0] === 'scan') {
                fetchPet(parts[1]);
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
        fetchPet(token);
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
                        <p>Click <strong>Start Camera</strong> and point it at a pet's QR code. The pet's profile will appear here as a modal.</p>
                    </div>
                </div>

                {/* Camera viewer */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                            <Camera className="h-4 w-4" />
                            Camera Scanner
                        </h2>
                        {scanning && (
                            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: themeColor }}>
                                <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: themeColor }} />
                                Scanning…
                            </span>
                        )}
                    </div>

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

                    <div className="px-5 py-4">
                        {!scanning ? (
                            <Button className="w-full gap-2" onClick={startScanner} disabled={loading}>
                                <Camera className="h-4 w-4" />
                                Start Camera
                            </Button>
                        ) : (
                            <Button variant="outline" className="w-full gap-2" onClick={stopScanner}>
                                <CameraOff className="h-4 w-4" />
                                Stop Camera
                            </Button>
                        )}
                    </div>
                </div>

                {/* Camera error */}
                {scanError && (
                    <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-4">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        {scanError}
                    </div>
                )}

                {/* Manual token lookup */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                        <Search className="h-4 w-4" />
                        Manual Token Lookup
                    </h2>
                    <p className="text-xs text-slate-400">
                        Enter the pet's QR token manually if the camera isn't available.
                    </p>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Paste QR token or UUID…"
                            value={manualToken}
                            onChange={(e) => setManualToken(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleManualLookup()}
                            className="font-mono text-sm"
                        />
                        <Button onClick={handleManualLookup} disabled={!manualToken.trim() || loading} className="shrink-0 gap-2">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            Look up
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Pet Result Modal ── */}
            {(loading || result) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">

                        {/* Loading state */}
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                                <Loader2 className="h-8 w-8 animate-spin" style={{ color: themeColor }} />
                                <p className="text-sm">Loading pet profile…</p>
                            </div>
                        )}

                        {result && (
                            <>
                                {/* Pet hero */}
                                <div className="relative h-40 rounded-t-2xl overflow-hidden" style={{ backgroundColor: themeColor }}>
                                    {result.pet.imageUrl ? (
                                        <img src={result.pet.imageUrl} alt={result.pet.name} className="w-full h-full object-cover opacity-60" style={{ objectPosition: 'center 25%' }} />
                                    ) : (
                                        <div className="flex items-center justify-center h-full opacity-20">
                                            <PawPrint className="h-24 w-24 text-white" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-4 left-4 text-white">
                                        <h2 className="text-2xl font-bold">{result.pet.name}</h2>
                                        <p className="text-sm text-white/80">{result.pet.species} · {result.pet.breed}</p>
                                    </div>
                                    <Badge
                                        className={`absolute top-3 left-4 capitalize ${result.pet.status === 'active' ? 'bg-white/90 border-white/60' : 'bg-slate-100/80 text-slate-500'}`}
                                        style={result.pet.status === 'active' ? { color: themeColor } : {}}
                                        variant="outline"
                                    >
                                        {result.pet.status}
                                    </Badge>
                                    <button
                                        onClick={() => setResult(null)}
                                        className="absolute top-3 right-3 h-7 w-7 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="p-5 space-y-5">
                                    {/* Details grid */}
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        {[
                                            { label: 'Age', value: result.pet.age != null ? `${result.pet.age} yr` : '—' },
                                            { label: 'Gender', value: result.pet.gender },
                                            { label: 'Color', value: result.pet.color || '—' },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="rounded-xl bg-slate-50 px-3 py-2.5">
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                                                <p className="text-sm font-semibold capitalize text-slate-800 mt-0.5">{value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {result.pet.microchipId && (
                                        <p className="text-xs text-slate-400 text-center">Microchip: <span className="font-mono text-slate-600">{result.pet.microchipId}</span></p>
                                    )}

                                    {/* Owner */}
                                    <div className="rounded-xl border border-slate-100 p-4 space-y-2">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
                                            <User className="h-3 w-3" /> Owner
                                        </p>
                                        <p className="font-semibold text-slate-800">{result.owner.name}</p>
                                        {result.owner.phone && (
                                            <p className="flex items-center gap-1.5 text-xs text-slate-500">
                                                <Phone className="h-3 w-3" /> {result.owner.phone}
                                            </p>
                                        )}
                                        {result.owner.email && (
                                            <p className="flex items-center gap-1.5 text-xs text-slate-500">
                                                <Mail className="h-3 w-3" /> {result.owner.email}
                                            </p>
                                        )}
                                    </div>

                                    {/* Vaccinations */}
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1.5 mb-2">
                                            <Syringe className="h-3 w-3" /> Vaccinations ({result.vaccinations.length})
                                        </p>
                                        {result.vaccinations.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic">No vaccinations recorded.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {result.vaccinations.map((v, i) => {
                                                    const overdue = new Date(v.nextDue) < new Date();
                                                    return (
                                                        <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-800">{v.vaccine}</p>
                                                                <p className="text-xs text-slate-400">Given: {fmt(v.date)}</p>
                                                            </div>
                                                            <Badge variant="outline" className={`text-xs ${overdue ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                                                Due {fmt(v.nextDue)}
                                                            </Badge>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Consultations */}
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1.5 mb-2">
                                            <FileText className="h-3 w-3" /> Visit History ({result.consultations.length})
                                        </p>
                                        {result.consultations.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic">No visits on record.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {result.consultations.slice(0, 5).map((c, i) => (
                                                    <div key={i} className="rounded-lg bg-slate-50 px-3 py-2">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium capitalize text-slate-800">{c.type}</p>
                                                            <p className="text-xs text-slate-400">{fmt(c.date)}</p>
                                                        </div>
                                                        {c.diagnosis && <p className="text-xs text-slate-500 mt-0.5">Dx: {c.diagnosis}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end pt-1">
                                        <Button variant="outline" onClick={() => setResult(null)}>
                                            <X className="h-4 w-4 mr-2" />
                                            Close
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

