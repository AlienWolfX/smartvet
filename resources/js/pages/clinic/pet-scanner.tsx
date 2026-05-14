import { Head, router, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useEffect, useRef, useState, useCallback } from 'react';
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
    Info,
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

interface ConsultationFile {
    id: number;
    name: string;
    url: string;
    mimeType: string;
    size: number;
    sizeFormatted: string;
    isImage: boolean;
}

interface ConsultationInventoryItem {
    id: number;
    name: string;
    quantity: number;
    unitPrice: number;
}

interface PetResult {
    pet: {
        name: string;
        species: string;
        breed: string;
        age: number | null;
        weight: number | null;
        gender: string;
        color: string | null;
        clinicIds?: number[];
        imageUrl: string | null;
        status: string;
        publicUrl: string;
        manageUrl: string;
    };
    owner: {
        name: string;
        phone: string;
        email: string | null;
        address?: string;
        region?: string;
        street?: string;
        barangay?: string;
        city?: string;
        province?: string;
        zipCode?: string;
        emergencyContact?: string;
        clinicUserId?: number;
    };
    documents: ConsultationFile[];
    clinicName?: string;
    hasHistoryAccess: boolean;
    vaccinations: { vaccine: string; date: string; nextDue: string; clinicName?: string }[];
    consultations: {
        clinicName: string | undefined;
        type: string;
        date: string;
        weight?: number | null;
        complaint: string | null;
        diagnosis: string | null;
        treatment?: string | null;
        inventoryItems?: ConsultationInventoryItem[];
        files?: ConsultationFile[];
    }[];
}

const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });

const getDateTimestamp = (date: string): number => {
    const parsed = Date.parse(date);
    return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
};

function sortRecordsLatestFirst<T extends { date: string }>(records: T[]): T[] {
    return [...records].sort((a, b) => getDateTimestamp(b.date) - getDateTimestamp(a.date));
}

export default function PetScanner() {
    const { auth } = usePage<SharedData>().props;
    const themeColor = (auth.user as { theme_color?: string })?.theme_color || '#0f172a';
    const currentUserId = (auth.user as { id?: number; user_id?: number })?.id ?? (auth.user as { user_id?: number })?.user_id;

    const [scanning, setScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [manualToken, setManualToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PetResult | null>(null);
    const [missingPetToken, setMissingPetToken] = useState<string | null>(null);
    const [scannedToken, setScannedToken] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const lastInvalidPromptAtRef = useRef(0);
    const { success, error } = useToast();

    useEffect(() => {
        const shouldHide = loading || Boolean(result);
        document.body.style.overflow = shouldHide ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [loading, result]);

    const SCANNER_DOM_ID = 'qr-reader';

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    const extractValidToken = (rawValue: string): string | null => {
        const decoded = rawValue.trim();
        if (!decoded) return null;

        if (UUID_REGEX.test(decoded)) {
            return decoded;
        }

        if (decoded.startsWith('/')) {
            const match = decoded.match(/^\/?scan\/([0-9a-f-]{36})\/?$/i);
            if (match && UUID_REGEX.test(match[1])) {
                return match[1];
            }

            return null;
        }

        try {
            const parsedUrl = new URL(decoded);
            const pathMatch = parsedUrl.pathname.match(/^\/?scan\/([0-9a-f-]{36})\/?$/i);
            if (pathMatch && UUID_REGEX.test(pathMatch[1])) {
                return pathMatch[1];
            }
        } catch {
            return null;
        }

        return null;
    };

    const promptInvalidQr = () => {
        const now = Date.now();
        if (now - lastInvalidPromptAtRef.current < 1800) {
            return;
        }

        lastInvalidPromptAtRef.current = now;
        error('Invalid QR code. Only SmartVet pet QR codes are supported.');
    };

    const startScanner = async () => {
        setScanError(null);
        try {
            const scanner = new Html5Qrcode(SCANNER_DOM_ID);
            scannerRef.current = scanner;
            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    const token = extractValidToken(decodedText);
                    if (!token) {
                        promptInvalidQr();
                        return;
                    }

                    scanner.stop().catch(() => { });
                    setScanning(false);
                    fetchPet(token);
                },
                () => { },
            );
            setScanning(true);
        } catch {
            setScanError('Could not access camera. Please allow camera permission and try again.');
            setScanning(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            await scannerRef.current.stop().catch(() => { });
            scannerRef.current = null;
        }
        setScanning(false);
    };

    useEffect(() => {
        return () => { scannerRef.current?.stop().catch(() => { }); };
    }, []);

    const fetchPet = async (token: string) => {
        setLoading(true);
        setResult(null);
        setMissingPetToken(null);
        setScannedToken(token);
        try {
            const res = await fetch(`/pet-records/scan-lookup/${token}`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!res.ok) {
                error(res.status === 404 ? 'No SmartVet pet found for this QR code.' : 'Failed to load pet data.');
                if (res.status === 404) {
                    setMissingPetToken(token);
                }
                return;
            }
            const data: PetResult = await res.json();
            // console.log('scan-lookup response:', data);
            setResult(data);
            success('Pet found!');
        } catch {
            error('Could not reach the server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleManualLookup = () => {
        const token = extractValidToken(manualToken);
        if (!token) {
            error('Invalid token or QR payload. Use a valid SmartVet pet QR token.');
            return;
        }

        fetchPet(token);
    };

    const handleDirectImport = useCallback(async () => {
        if (!result || !scannedToken) return;

        setIsImporting(true);
        try {
            const formData = new FormData();
            formData.append('petName', result.pet.name);
            formData.append('species', result.pet.species);
            formData.append('breed', result.pet.breed);
            formData.append('age', result.pet.age?.toString() || '');
            formData.append('weight', result.pet.weight?.toString() || '');
            formData.append('gender', result.pet.gender);
            formData.append('color', result.pet.color || '');
            formData.append('ownerName', result.owner.name);
            formData.append('phone', result.owner.phone);
            formData.append('email', result.owner.email || '');

            const addressParts = (result.owner.address ?? '').split(',').map(part => part.trim()).filter(Boolean);
            const street = result.owner.street || addressParts[0] || '';
            const barangay = result.owner.barangay || addressParts[1] || '';
            const city = result.owner.city || addressParts[2] || '';
            const province = result.owner.province || addressParts[3] || '';
            const zipCode = result.owner.zipCode || addressParts[4] || '';
            const region = result.owner.region || province || city || 'Unknown';

            formData.append('region', region);
            formData.append('province', province || region);
            formData.append('city', city || province || region);
            formData.append('barangay', barangay || city || province || region);
            formData.append('street', street);
            formData.append('zipCode', zipCode);
            formData.append('qrToken', scannedToken);

            // Download and add pet image if available
            if (result.pet.imageUrl) {
                try {
                    const response = await fetch(result.pet.imageUrl);
                    const blob = await response.blob();
                    const fileName = `imported-${scannedToken}.${blob.type.split('/')[1] || 'jpg'}`;
                    const file = new File([blob], fileName, { type: blob.type });
                    formData.append('petImage', file);
                } catch (imgErr) {
                    console.warn('Failed to download pet image:', imgErr);
                    // Continue without image if download fails
                }
            }

            router.post('/pet-records', formData, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    success('Pet imported successfully!');
                    setResult(null);
                    setScannedToken(null);
                    setTimeout(() => router.visit('/pet-records'), 500);
                },
                onError: (errs) => {
                    let errorMsg = 'Failed to import pet';
                    if (errs && typeof errs === 'object') {
                        const firstErr = Object.values(errs)[0];
                        if (Array.isArray(firstErr)) {
                            errorMsg = firstErr[0];
                        } else if (typeof firstErr === 'string') {
                            errorMsg = firstErr;
                        }
                    }
                    error(errorMsg);
                    setIsImporting(false);
                },
                onFinish: () => setIsImporting(false),
            });
        } catch (err) {
            error('Error preparing pet import');
            setIsImporting(false);
            console.error('Import error:', err);
        }
    }, [result, scannedToken, router, success, error]);

    const handleImportPet = () => {
        if (!missingPetToken) {
            return;
        }

        router.visit(`/pet-records?importToken=${encodeURIComponent(missingPetToken)}`);
    };

    const sortedVaccinations = result ? sortRecordsLatestFirst(result.vaccinations) : [];
    const sortedConsultations = result ? sortRecordsLatestFirst(result.consultations).slice(0, 5) : [];
    const documents = result ? result.documents : [];

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
                        <p>Click <strong>Start Camera</strong> and point it at a pet's QR code.</p>
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
                            <Button className="w-full gap-2 text-white" style={{ backgroundColor: themeColor, borderColor: themeColor }} onClick={startScanner} disabled={loading}>
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

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                        <Search className="h-4 w-4" />
                        Manual Lookup
                    </h2>
                    <p className="text-xs text-slate-400">
                        Enter the pet's token.
                    </p>
                    <div className="flex flex-col gap-2">
                        <label className="sr-only" htmlFor="manualToken">Pet token</label>
                        <Input
                            id="manualToken"
                            name="manualToken"
                            placeholder="Paste token…"
                            value={manualToken}
                            onChange={(e) => setManualToken(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleManualLookup()}
                            className="font-mono text-sm"
                        />
                        <Button onClick={handleManualLookup} disabled={!manualToken.trim() || loading} className="shrink-0 gap-2 text-white" style={{ backgroundColor: themeColor, borderColor: themeColor }}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            Look up
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Pet Result Modal ── */}
            {(loading || result) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="relative w-full max-w-lg max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl">
                        <div className="h-full max-h-[90vh] overflow-y-auto">

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
                                        <p className="text-xs uppercase tracking-wide text-white/70">{result.clinicName ?? 'SmartVet'}</p>
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
                                    {/* Pet + Owner Details */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-xl border border-slate-100 p-4 space-y-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
                                                <Info className="h-3 w-3" /> Pet Information
                                            </p>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                                                    <span className="text-xs font-medium text-slate-500">Species</span>
                                                    <span className="text-sm font-semibold text-slate-800">{result.pet.species}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                                                    <span className="text-xs font-medium text-slate-500">Breed</span>
                                                    <span className="text-sm font-semibold text-slate-800">{result.pet.breed || '—'}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                                                    <span className="text-xs font-medium text-slate-500">Age</span>
                                                    <span className="text-sm font-semibold text-slate-800">{result.pet.age != null ? `${result.pet.age} years` : '—'}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                                                    <span className="text-xs font-medium text-slate-500">Gender</span>
                                                    <span className="text-sm font-semibold text-slate-800 capitalize">{result.pet.gender || '—'}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                                                    <span className="text-xs font-medium text-slate-500">Color</span>
                                                    <span className="text-sm font-semibold text-slate-800 capitalize">{result.pet.color || '—'}</span>
                                                </div>
                                                {result.pet.weight && (
                                                    <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                                                        <span className="text-xs font-medium text-slate-500">Weight</span>
                                                        <span className="text-sm font-semibold text-slate-800">{result.pet.weight} kg</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

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
                                            {(result.owner.street || result.owner.barangay || result.owner.city || result.owner.province || result.owner.zipCode) && (
                                                <p className="text-xs text-slate-500">
                                                    {[result.owner.street, result.owner.barangay, result.owner.city, result.owner.province, result.owner.zipCode].filter(Boolean).join(', ')}
                                                </p>
                                            )}
                                            {result.owner.emergencyContact && (
                                                <p className="text-xs text-slate-500">
                                                    <span className="font-semibold">Emergency:</span> {result.owner.emergencyContact}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {!result.hasHistoryAccess && (
                                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                                            You do not currently have access to {result.clinicName}'s history. Please contact <b>{result.clinicName}</b> to request permission.
                                        </div>
                                    )}

                                    {documents.length > 0 && (
                                        <div className="rounded-xl border border-slate-100 p-4">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1.5 mb-2">
                                                <FileText className="h-3 w-3" /> Documents
                                            </p>
                                            <div className="space-y-2">
                                                {documents.map((doc) => (
                                                    <a
                                                        key={doc.id}
                                                        href={doc.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                                                    >
                                                        <span className="truncate">{doc.name}</span>
                                                        <span className="text-xs text-neutral-400">{doc.sizeFormatted}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Vaccinations */}
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1.5 mb-2">
                                            <Syringe className="h-3 w-3" /> Vaccinations ({result.vaccinations.length})
                                        </p>
                                        {result.vaccinations.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic">No vaccinations recorded.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {sortedVaccinations.map((v, i) => {
                                                    const overdue = new Date(v.nextDue) < new Date();
                                                    return (
                                                        <div key={i} className="relative pl-7">
                                                            <span
                                                                className={`absolute left-0 top-2 h-3 w-3 rounded-full border-2 border-white shadow ${i === 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                                                aria-hidden="true"
                                                            />
                                                            {i !== sortedVaccinations.length - 1 && (
                                                                <span
                                                                    className="absolute left-[5px] top-6 bottom-[-8px] w-px bg-slate-300"
                                                                    aria-hidden="true"
                                                                />
                                                            )}
                                                            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                                                <div>
                                                                    <p className="text-sm font-medium text-slate-800">{v.vaccine}</p>
                                                                    <p className="text-xs text-slate-400">Given: {fmt(v.date)}</p>
                                                                    <p className="text-xs text-slate-500">Clinic: {v.clinicName ?? result.clinicName ?? 'SmartVet'}</p>
                                                                </div>
                                                                <Badge variant="outline" className={`text-xs ${overdue ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                                                    Due {fmt(v.nextDue)}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Consultations */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
                                                <FileText className="h-3 w-3" /> Visit History ({result.consultations.length})
                                            </p>
                                            {result.consultations.length > 5 && (
                                                <a href={result.pet.publicUrl} className="text-xs font-semibold" style={{ color: themeColor }}>
                                                    View All →
                                                </a>
                                            )}
                                        </div>
                                        {result.consultations.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic">No visits on record.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {sortedConsultations.map((c, i) => (
                                                    <div key={i} className="relative pl-7">
                                                        <span
                                                            className={`absolute left-0 top-2 h-3 w-3 rounded-full border-2 border-white shadow ${i === 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                                            aria-hidden="true"
                                                        />
                                                        {i !== sortedConsultations.length - 1 && (
                                                            <span
                                                                className="absolute left-[5px] top-6 bottom-[-8px] w-px bg-slate-300"
                                                                aria-hidden="true"
                                                            />
                                                        )}
                                                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-sm font-medium capitalize text-slate-800">{c.type}</p>
                                                                <p className="text-xs text-slate-400">{fmt(c.date)}</p>
                                                            </div>
                                                            <p className="text-xs text-slate-500 mt-0.5"><span className="font-medium">Clinic:</span> {c.clinicName ?? result.clinicName ?? 'SmartVet'}</p>
                                                            {c.complaint && <p className="text-xs text-slate-500 mt-0.5"><span className="font-medium">Complaint:</span> {c.complaint}</p>}
                                                            {c.weight != null && <p className="text-xs text-slate-500"><span className="font-medium">Weight:</span> {c.weight} kg</p>}
                                                            {c.diagnosis && <p className="text-xs text-slate-500"><span className="font-medium">Diagnosis:</span> {c.diagnosis}</p>}
                                                            {c.treatment && <p className="text-xs text-slate-500"><span className="font-medium">Treatment:</span> {c.treatment}</p>}

                                                            {c.inventoryItems && c.inventoryItems.length > 0 && (
                                                                <div className="mt-2">
                                                                    <p className="text-xs font-semibold text-neutral-500">Medication Used</p>
                                                                    <ul className="mt-1 space-y-1 text-xs text-neutral-600">
                                                                        {c.inventoryItems.map((item) => (
                                                                            <li key={item.id} className="flex justify-between gap-2">
                                                                                <span className="truncate">{item.name}</span>
                                                                                <span className="text-neutral-400">{item.quantity}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                                        {result && currentUserId != null && scannedToken && !result.pet.clinicIds?.includes(currentUserId) && (
                                            <Button
                                                className="gap-2 text-white flex-1"
                                                style={{ backgroundColor: themeColor, borderColor: themeColor }}
                                                onClick={handleDirectImport}
                                                disabled={isImporting}
                                            >
                                                {isImporting ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Importing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <PawPrint className="h-4 w-4" />
                                                        Import Pet to Clinic
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => { setResult(null); setScannedToken(null); }}
                                            disabled={isImporting}
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Close
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Missing Pet Import Modal ── */}
            {missingPetToken && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl">
                        <button
                            onClick={() => setMissingPetToken(null)}
                            className="absolute top-3 right-3 h-7 w-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        <div className="p-6 space-y-5">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: themeColor + '15' }}>
                                    <QrCode className="h-6 w-6" style={{ color: themeColor }} />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-semibold text-slate-800">QR Code Not Found</h2>
                                    <p className="text-sm text-slate-600 mt-2">
                                        This QR code doesn't match any pet in your clinic's database. You can import this new pet by creating a registration record.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                                <div>
                                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">QR Token ID</p>
                                    <p className="font-mono text-sm text-blue-900 mt-1 break-all font-semibold">{missingPetToken}</p>
                                </div>
                                <p className="text-xs text-blue-700 mt-2">You'll be able to view and edit pet details during import.</p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setMissingPetToken(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 gap-2 text-white"
                                    style={{ backgroundColor: themeColor, borderColor: themeColor }}
                                    onClick={handleImportPet}
                                >
                                    <PawPrint className="h-4 w-4" />
                                    Import New Pet
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

