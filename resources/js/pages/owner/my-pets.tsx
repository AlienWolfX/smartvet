import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import OwnerLayout from '@/layouts/owner-layout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import OnboardingTour, { type OnboardingStep } from '@/components/onboarding-tour';
import { type SharedData } from '@/types';
import {
    CalendarDays,
    Ruler,
    Scale,
    VenusAndMars,
    Info,
    QrCode,
    ClipboardList,
    X,
    Syringe,
    Stethoscope,
    Pencil,
    User,
    Phone,
    Mail,
    FileText,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import QRCodeLib from 'qrcode';

interface Pet {
    id: string | number;
    name: string;
    species: string;
    speciesId: number | null;
    speciesIcon: string;
    breed: string;
    age: number;
    weight: string | number;
    gender: string;
    color: string;
    status: string;
    lastVisit: string | null;
    imageUrl: string | null;
    qrToken: string | null;
    microchipId?: string;
}

interface Vaccination {
    vaccine: string;
    date: string;
    nextDue: string;
    clinicName?: string | null;
}

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

interface Consultation {
    clinicName: string | null;
    type: string;
    date: string;
    weight?: number | null;
    complaint: string;
    diagnosis: string;
    treatment?: string;
    notes?: string | null;
    inventoryItems?: ConsultationInventoryItem[];
    files?: ConsultationFile[];
}

interface OwnerInfo {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    street?: string;
    barangay?: string;
    city?: string;
    province?: string;
    zipCode?: string;
    emergencyContact?: string;
}

const getOwnerAddress = (owner: OwnerInfo | null): string => {
    if (!owner) {
        return '';
    }

    const structuredAddress = [owner.street, owner.barangay, owner.city, owner.province, owner.zipCode]
        .filter(Boolean)
        .join(', ');

    return structuredAddress || owner.address || '';
};

interface DocumentFile {
    id: number;
    name: string;
    url: string;
    mimeType: string;
    size: number;
    sizeFormatted: string;
    isImage: boolean;
}

const getDateTimestamp = (date: string): number => {
    const parsed = Date.parse(date);
    return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
};

function sortRecordsLatestFirst<T extends { date: string }>(records: T[]): T[] {
    return [...records].sort((a, b) => getDateTimestamp(b.date) - getDateTimestamp(a.date));
}

interface MyPetsProps {
    pets: Pet[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
    Healthy:  { label: 'Healthy',  className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    Sick:     { label: 'Sick',     className: 'bg-red-50 text-red-700 border-red-200' },
    Recovery: { label: 'Recovery', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    Critical: { label: 'Critical', className: 'bg-red-100 text-red-800 border-red-300' },
};

function PetCard({ pet, onShowQr, onShowRecord, onEdit }: { pet: Pet; onShowQr: (pet: Pet) => void; onShowRecord: (pet: Pet) => void; onEdit: (pet: Pet) => void }) {
    const status = statusConfig[pet.status] ?? { label: pet.status, className: 'bg-slate-50 text-slate-600 border-slate-200' };

    return (
        <Card className="overflow-hidden flex flex-col transition-all hover:shadow-md">
            {/* Hero image / icon */}
            <div className="relative h-40 shrink-0 bg-gradient-to-br from-[#0e4d3a] to-[#1a7a5e] flex items-center justify-center">
                {pet.imageUrl ? (
                    <img
                        src={pet.imageUrl}
                        alt={pet.name}
                        className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
                    />
                ) : (
                    <span className="text-5xl select-none">{pet.speciesIcon}</span>
                )}
                <div className="absolute bottom-2 right-2">
                    <Badge variant="outline" className={`text-xs font-medium ${status.className}`}>
                        {status.label}
                    </Badge>
                </div>
            </div>

            {/* Name block – fixed height, truncated */}
            <div className="px-4 pt-4 pb-3 border-b border-neutral-100 shrink-0">
                <p className="font-semibold text-neutral-900 leading-tight line-clamp-1">{pet.name}</p>
                <p className="text-sm text-neutral-500 mt-0.5 line-clamp-1">{pet.species} · {pet.breed}</p>
            </div>

            {/* Info grid */}
            <div className="px-4 py-3 flex-1">
                <dl className="grid grid-cols-2 gap-y-2.5 text-sm">
                    <div className="flex items-center gap-1.5 text-neutral-600">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                        <span className="truncate">{pet.age != null ? `${pet.age} yr${pet.age !== 1 ? 's' : ''}` : '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-600">
                        <Scale className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                        <span className="truncate">{pet.weight ? `${pet.weight} kg` : '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-600">
                        <VenusAndMars className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                        <span className="truncate">{pet.gender || '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-600">
                        <Ruler className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                        <span className="truncate">{pet.color || '—'}</span>
                    </div>
                </dl>
                <p className="mt-2.5 text-xs text-neutral-400">
                    Last visit: <span className="font-medium text-neutral-500">{pet.lastVisit ?? '—'}</span>
                </p>
            </div>

            {/* Actions – always pinned to bottom */}
            <div className="px-4 pb-4 pt-3 border-t border-neutral-100 shrink-0 flex gap-2">
                {pet.qrToken && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => onShowQr(pet)}
                    >
                        <QrCode className="h-3.5 w-3.5 mr-1" />
                        QR
                    </Button>
                )}
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => onShowRecord(pet)}
                >
                    <ClipboardList className="h-3.5 w-3.5 mr-1" />
                    Record
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => onEdit(pet)}
                >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Edit
                </Button>
            </div>
        </Card>
    );
}

export default function MyPets({ pets }: MyPetsProps) {
    const { auth } = usePage<SharedData>().props;
    const [showTour, setShowTour] = useState(!((auth.user as { onboarding_complete?: boolean })?.onboarding_complete));
    const hasPets = pets.length > 0;

    const ownerOnboardingSteps: OnboardingStep[] = [
        {
            title: 'Welcome to your pet portal',
            description: 'This tour helps you find every pet record and keep your clinic informed.',
            bulletPoints: [
                'View all your registered pets in one place.',
                'Open a pet’s record to see details, consultations, and vaccination history.',
            ],
        },
        {
            title: 'Access pet health records',
            description: 'The pet record lets you review consultations, vaccinations, and shared documents.',
            bulletPoints: [
                'See consultation notes, treatment plans, and medical files for each visit.',
                'Check vaccination dates and next due reminders from your clinic.',
            ],
        },
        {
            title: 'Use QR codes for faster visits',
            description: 'QR codes help your clinic quickly access your pet’s profile during appointments.',
            bulletPoints: [
                'Generate a pet QR code from the pet card.',
                'Share the QR code at the clinic for faster check-in and record retrieval.',
            ],
        },
        {
            title: 'Keep your pet info up to date',
            description: 'Accurate pet details make each visit smoother and safer.',
            bulletPoints: [
                'Edit your pet’s breed, weight, and microchip information as needed.',
                'Ask your clinic to link new pets to your account if they are not visible yet.',
            ],
        },
    ];

    const handleCompleteTour = () => {
        setShowTour(false);
        router.post('/onboarding/complete', {}, { preserveState: true, preserveScroll: true });
    };

    // QR modal
    const [qrPet, setQrPet] = useState<Pet | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if (qrPet?.qrToken && canvasRef.current) {
            QRCodeLib.toCanvas(canvasRef.current, qrPet.qrToken, { width: 220, margin: 2 });
        }
    }, [qrPet]);

    // Records modal
    const [recordPet, setRecordPet] = useState<Pet | null>(null);
    const [recordPetDetails, setRecordPetDetails] = useState<Partial<Pet> | null>(null);
    const [recordOwner, setRecordOwner] = useState<OwnerInfo | null>(null);
    const [recordClinicName, setRecordClinicName] = useState<string | null>(null);
    const [recordDocuments, setRecordDocuments] = useState<DocumentFile[]>([]);
    const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [recordLoading, setRecordLoading] = useState(false);
    const sortedVaccinations = sortRecordsLatestFirst(vaccinations);
    const sortedConsultations = sortRecordsLatestFirst(consultations);
    const recordOwnerAddress = getOwnerAddress(recordOwner);

    const closeRecordModal = () => {
        setRecordPet(null);
        setRecordPetDetails(null);
        setRecordOwner(null);
        setRecordClinicName(null);
        setRecordDocuments([]);
        setVaccinations([]);
        setConsultations([]);
    };

    const handleShowRecord = async (pet: Pet) => {
        setRecordPet(pet);
        setRecordOwner(null);
        setRecordDocuments([]);
        setVaccinations([]);
        setConsultations([]);
        setRecordLoading(true);
        try {
            const res = await fetch(`/owner/pets/${pet.id}/record`, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data = await res.json();
            setRecordPetDetails(data.pet ?? null);
            setRecordOwner(data.owner ?? null);
            setRecordClinicName(data.clinicName ?? null);
            setRecordDocuments(data.documents ?? []);
            setVaccinations(data.vaccinations ?? []);
            setConsultations(data.consultations ?? []);
        } finally {
            setRecordLoading(false);
        }
    };

    // Edit modal
    const [editPet, setEditPet] = useState<Pet | null>(null);
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<{
        petImage: File | null;
        _method: string;
        name: string;
        breed: string;
        color: string;
        age: string;
        weight: string;
        gender: string;
        microchipId: string;
    }>({
        petImage: null,
        _method: 'PUT',
        name: '',
        breed: '',
        color: '',
        age: '',
        weight: '',
        gender: '',
        microchipId: '',
    });

    const openEdit = (pet: Pet) => {
        setEditPet(pet);
        clearErrors();
        reset();
        setData({
            petImage: null,
            _method: 'PUT',
            name: pet.name,
            breed: pet.breed ?? '',
            color: pet.color ?? '',
            age: pet.age != null ? String(pet.age) : '',
            weight: pet.weight != null ? String(pet.weight) : '',
            gender: pet.gender ?? '',
            microchipId: pet.microchipId ?? '',
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editPet) return;
        post(`/owner/pets/${editPet.id}`, {
            forceFormData: true,
            onSuccess: () => setEditPet(null),
        });
    };

    return (
        <OwnerLayout
            title="My Pets"
            description="View your registered pets and their health records."
        >
            <Head title="My Pets" />
            <OnboardingTour
                open={showTour}
                title="Owner onboarding tour"
                description="Step through the key actions for managing your pets and health records."
                steps={ownerOnboardingSteps}
                onComplete={handleCompleteTour}
                onClose={() => setShowTour(false)}
            />

            {!hasPets && (
                <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                        You don't have any pets linked yet. Ask your clinic to register your pets under your account.
                    </span>
                </div>
            )}

            {hasPets && (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {pets.map((pet) => (
                        <PetCard key={pet.id} pet={pet} onShowQr={setQrPet} onShowRecord={handleShowRecord} onEdit={openEdit} />
                    ))}
                </div>
            )}

            {/* QR Modal */}
            {qrPet && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4" onClick={() => setQrPet(null)}>
                    <div className="mx-auto mt-4 w-full max-w-xs rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setQrPet(null)} className="absolute right-3 top-3 rounded-full p-1 text-neutral-400 hover:text-neutral-700">
                            <X className="h-5 w-5" />
                        </button>
                        <div className="flex flex-col items-center gap-3 p-6 pt-8">
                            <p className="text-lg font-semibold text-neutral-900">{qrPet.name}</p>
                            <p className="text-sm text-neutral-500">{qrPet.species} · {qrPet.breed}</p>
                            <canvas ref={canvasRef} className="rounded-xl" />
                            <p className="text-center text-xs text-neutral-400">Scan to view {qrPet.name}'s public pet profile</p>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    const canvas = canvasRef.current;
                                    if (!canvas) return;
                                    const link = document.createElement('a');
                                    link.download = `${qrPet.name}-qr.png`;
                                    link.href = canvas.toDataURL();
                                    link.click();
                                }}
                            >
                                Download QR
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pet Record Modal */}
            {recordPet && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4" onClick={closeRecordModal}>
                    <div className="mx-auto mt-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[95vh] min-h-[54vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b px-5 py-4">
                            <div>
                                <p className="text-lg font-semibold text-neutral-900">{recordPet.name}'s Record</p>
                                <p className="text-sm text-neutral-500">{recordPet.species} · {recordPet.breed}</p>
                                {recordClinicName && (
                                    <p className="text-sm text-neutral-500 mt-1">
                                        <span className="font-medium">Registered at:</span> {recordClinicName}
                                    </p>
                                )}
                            </div>
                            <button onClick={closeRecordModal} className="rounded-full p-1 text-neutral-400 hover:text-neutral-700">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">
                            {recordLoading ? (
                                <div className="py-10 text-center text-neutral-400">Loading...</div>
                            ) : (
                                <>
                                    {/* Pet & Owner */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 flex items-center gap-1.5 mb-2">
                                                <Info className="h-3.5 w-3.5" />
                                                Pet
                                            </p>
                                            <p className="font-semibold text-neutral-800">{recordPet?.name ?? '-'}</p>
                                            <p className="text-xs text-neutral-500">{recordPet?.species} · {recordPet?.breed}</p>
                                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-neutral-600">
                                                {recordPetDetails?.microchipId && (
                                                    <div className="rounded-lg bg-white px-2 py-1">
                                                        <p className="font-medium">Microchip</p>
                                                        <p className="truncate">{recordPetDetails.microchipId}</p>
                                                    </div>
                                                )}
                                                {recordPet?.age != null && (
                                                    <div className="rounded-lg bg-white px-2 py-1">
                                                        <p className="font-medium">Age</p>
                                                        <p className="truncate">{recordPet.age} yr</p>
                                                    </div>
                                                )}
                                                {recordPet?.gender && (
                                                    <div className="rounded-lg bg-white px-2 py-1">
                                                        <p className="font-medium">Gender</p>
                                                        <p className="truncate capitalize">{recordPet.gender}</p>
                                                    </div>
                                                )}
                                                {recordPet?.color && (
                                                    <div className="rounded-lg bg-white px-2 py-1">
                                                        <p className="font-medium">Color</p>
                                                        <p className="truncate capitalize">{recordPet.color}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 flex items-center gap-1.5 mb-2">
                                                <User className="h-3.5 w-3.5" />
                                                Owner
                                            </p>
                                            <p className="font-semibold text-neutral-800">{recordOwner?.name ?? '-'}</p>
                                            {recordOwner?.phone && (
                                                <p className="flex items-center gap-1.5 text-xs text-neutral-500 mt-1">
                                                    <Phone className="h-3.5 w-3.5" />
                                                    {recordOwner.phone}
                                                </p>
                                            )}
                                            {recordOwner?.email && (
                                                <p className="flex items-center gap-1.5 text-xs text-neutral-500">
                                                    <Mail className="h-3.5 w-3.5" />
                                                    {recordOwner.email}
                                                </p>
                                            )}
                                            {recordOwnerAddress && (
                                                <p className="text-xs text-neutral-500 mt-1">
                                                    {recordOwnerAddress}
                                                </p>
                                            )}
                                            {recordOwner?.emergencyContact && (
                                                <p className="text-xs text-neutral-500 mt-1">
                                                    <span className="font-semibold">Emergency:</span> {recordOwner.emergencyContact}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {recordDocuments.length > 0 && (
                                        <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 flex items-center gap-1.5 mb-2">
                                                <FileText className="h-3.5 w-3.5" />
                                                Documents
                                            </p>
                                            <div className="space-y-2">
                                                {recordDocuments.map((doc) => (
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
                                    <section>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Syringe className="h-4 w-4 text-emerald-600" />
                                            <h3 className="text-sm font-semibold text-neutral-800">Vaccinations</h3>
                                        </div>
                                        {vaccinations.length > 0 ? (
                                            <div className="space-y-3">
                                                {sortedVaccinations.map((v, i) => {
                                                    const isLatest = i === 0;

                                                    return (
                                                        <div key={i} className="relative pl-6">
                                                            <span
                                                                className={`absolute left-0 top-2 h-2.5 w-2.5 rounded-full ${isLatest ? 'bg-emerald-500' : 'bg-neutral-300'}`}
                                                                aria-hidden="true"
                                                            />
                                                            {i !== sortedVaccinations.length - 1 && (
                                                                <span
                                                                    className="absolute left-[4px] top-5 bottom-[-8px] w-px bg-neutral-200"
                                                                    aria-hidden="true"
                                                                />
                                                            )}
                                                            <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5">
                                                                <p className="text-sm font-medium text-neutral-800">{v.vaccine}</p>
                                                                <p className="text-xs text-neutral-500 mt-0.5">Given: {v.date} · Next due: {v.nextDue}</p>
                                                                {v.clinicName && (
                                                                    <p className="text-xs text-neutral-500 mt-1">Clinic: {v.clinicName}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-neutral-400">No vaccination records.</p>
                                        )}
                                    </section>

                                    {/* Visit History */}
                                    <section>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Stethoscope className="h-4 w-4 text-sky-600" />
                                            <h3 className="text-sm font-semibold text-neutral-800">Visit History</h3>
                                        </div>
                                        {consultations.length > 0 ? (
                                            <div className="space-y-3">
                                                {sortedConsultations.map((c, i) => {
                                                    const isLatest = i === 0;

                                                    return (
                                                        <div key={i} className="relative pl-6">
                                                            <span
                                                                className={`absolute left-0 top-2 h-2.5 w-2.5 rounded-full ${isLatest ? 'bg-emerald-500' : 'bg-neutral-300'}`}
                                                                aria-hidden="true"
                                                            />
                                                            {i !== sortedConsultations.length - 1 && (
                                                                <span
                                                                    className="absolute left-[4px] top-5 bottom-[-8px] w-px bg-neutral-200"
                                                                    aria-hidden="true"
                                                                />
                                                            )}
                                                            <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5">
                                                                <div className="flex items-center justify-between">
                                                                    <Badge variant="outline" className="text-xs">{c.type}</Badge>
                                                                    <span className="text-xs text-neutral-400">{c.date}</span>
                                                                </div>
                                                                {c.clinicName && <p className="text-xs text-neutral-500"><span className="font-medium">Clinic:</span> {c.clinicName}</p>}
                                                                {c.weight != null && <p className="text-xs text-neutral-500"><span className="font-medium">Weight:</span> {c.weight} kg</p>}
                                                                {c.complaint && <p className="text-xs text-neutral-600 mt-1"><span className="font-medium">Complaint:</span> {c.complaint}</p>}
                                                                {c.diagnosis && <p className="text-xs text-neutral-600"><span className="font-medium">Diagnosis:</span> {c.diagnosis}</p>}

                                                                {c.treatment && <p className="text-xs text-neutral-600"><span className="font-medium">Treatment:</span> {c.treatment}</p>}
                                                                <p className="text-xs text-neutral-500 mt-1"><span className="font-medium">Additional Notes:</span> {c.notes ? c.notes : 'N/A'}</p>

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
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-neutral-400">No visit history.</p>
                                        )}
                                    </section>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Edit Pet Modal */}
            {editPet && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4" onClick={() => setEditPet(null)}>
                    <div className="mx-auto mt-4 w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[90vh] min-h-[48vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b px-5 py-4">
                            <div>
                                <p className="text-lg font-semibold text-neutral-900">Edit {editPet.name}</p>
                                <p className="text-sm text-neutral-500">Update your pet's basic information</p>
                            </div>
                            <button onClick={() => setEditPet(null)} className="rounded-full p-1 text-neutral-400 hover:text-neutral-700">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="col-span-1 sm:col-span-2 space-y-1">
                                    <Label htmlFor="pet-name">Pet Name</Label>
                                    <Input
                                        id="pet-name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        disabled={processing}
                                    />
                                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                                </div>
                                <div className="col-span-1 sm:col-span-2 space-y-1">
                                    <Label>Species</Label>
                                    <Input value={editPet?.species ?? ''} disabled />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="pet-breed">Breed</Label>
                                    <Input
                                        id="pet-breed"
                                        value={data.breed}
                                        onChange={(e) => setData('breed', e.target.value)}
                                        disabled={processing}
                                    />
                                    {errors.breed && <p className="text-xs text-red-500">{errors.breed}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="pet-color">Color</Label>
                                    <Input
                                        id="pet-color"
                                        value={data.color}
                                        onChange={(e) => setData('color', e.target.value)}
                                        disabled={processing}
                                    />
                                    {errors.color && <p className="text-xs text-red-500">{errors.color}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="pet-age">Age (years)</Label>
                                    <Input
                                        id="pet-age"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={data.age}
                                        onChange={(e) => setData('age', e.target.value)}
                                        disabled={processing}
                                    />
                                    {errors.age && <p className="text-xs text-red-500">{errors.age}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="pet-weight">Weight (kg)</Label>
                                    <Input
                                        id="pet-weight"
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={data.weight}
                                        onChange={(e) => setData('weight', e.target.value)}
                                        disabled={processing}
                                    />
                                    {errors.weight && <p className="text-xs text-red-500">{errors.weight}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="pet-gender">Gender</Label>
                                    <Input
                                        id="pet-gender"
                                        value={data.gender}
                                        onChange={(e) => setData('gender', e.target.value)}
                                        disabled={processing}
                                    />
                                    {errors.gender && <p className="text-xs text-red-500">{errors.gender}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="pet-microchip">Microchip ID</Label>
                                    <Input
                                        id="pet-microchip"
                                        value={data.microchipId}
                                        onChange={(e) => setData('microchipId', e.target.value)}
                                        disabled={processing}
                                    />
                                    {errors.microchipId && <p className="text-xs text-red-500">{errors.microchipId}</p>}
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label htmlFor="edit-photo">Photo</Label>
                                    <Input
                                        id="edit-photo"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setData('petImage', e.target.files?.[0] ?? null)}
                                        disabled={processing}
                                        className="cursor-pointer"
                                    />
                                    {errors.petImage && <p className="text-xs text-red-500">{errors.petImage}</p>}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2 pb-1">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setEditPet(null)} disabled={processing}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1" disabled={processing}>
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </OwnerLayout>
    );
}
