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
        gender: string;
        color: string | null;
        microchipId: string | null;
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
        street?: string;
        barangay?: string;
        city?: string;
        province?: string;
        zipCode?: string;
        emergencyContact?: string;
    };
    documents: ConsultationFile[];
    clinicName?: string;
    vaccinations: { vaccine: string; date: string; nextDue: string; clinicName?: string }[];
    consultations: {
        clinicName: string | undefined;
        type: string;
        date: string;
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

    const [scanning, setScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [manualToken, setManualToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PetResult | null>(null);
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

    const handleManualLookup = () => {
        const token = extractValidToken(manualToken);
        if (!token) {
            error('Invalid token or QR payload. Use a valid SmartVet pet QR token.');
            return;
        }

        fetchPet(token);
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

                                    {/* Pet + Owner Details */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-xl border border-slate-100 p-4 space-y-2">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
                                                <Info className="h-3 w-3" /> Pet
                                            </p>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600">
                                                <div className="rounded-lg bg-white px-2 py-1">
                                                    <p className="font-medium">Age</p>
                                                    <p className="truncate">{result.pet.age != null ? `${result.pet.age} yr` : '—'}</p>
                                                </div>
                                                <div className="rounded-lg bg-white px-2 py-1">
                                                    <p className="font-medium">Gender</p>
                                                    <p className="truncate capitalize">{result.pet.gender || '—'}</p>
                                                </div>
                                                <div className="rounded-lg bg-white px-2 py-1">
                                                    <p className="font-medium">Color</p>
                                                    <p className="truncate capitalize">{result.pet.color || '—'}</p>
                                                </div>
                                                {result.pet.microchipId && (
                                                    <div className="rounded-lg bg-white px-2 py-1">
                                                        <p className="font-medium">Microchip</p>
                                                        <p className="truncate">{result.pet.microchipId}</p>
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
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1.5 mb-2">
                                            <FileText className="h-3 w-3" /> Visit History ({result.consultations.length})
                                        </p>
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
                </div>
            )}
        </AdminLayout>
    );
}

