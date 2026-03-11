import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import OwnerLayout from '@/layouts/owner-layout';
import { Head } from '@inertiajs/react';
import {
    CalendarDays,
    PawPrint,
    Ruler,
    Scale,
    VenusAndMars,
    Info,
    QrCode,
    ClipboardList,
    X,
    Syringe,
    Stethoscope,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import QRCodeLib from 'qrcode';

interface Pet {
    id: string | number;
    name: string;
    species: string;
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
}

interface Vaccination {
    vaccine: string;
    date: string;
    nextDue: string;
}

interface Consultation {
    type: string;
    date: string;
    complaint: string;
    diagnosis: string;
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

function PetCard({ pet, onShowQr, onShowRecord }: { pet: Pet; onShowQr: (pet: Pet) => void; onShowRecord: (pet: Pet) => void }) {
    const status = statusConfig[pet.status] ?? { label: pet.status, className: 'bg-slate-50 text-slate-600 border-slate-200' };

    return (
        <Card className="overflow-hidden transition-all hover:shadow-md">
            {/* Card Header – species colour band */}
            <div className="relative h-40 bg-gradient-to-br from-[#0e4d3a] to-[#1a7a5e] flex items-center justify-center">
                {pet.imageUrl ? (
                    <img
                        src={pet.imageUrl}
                        alt={pet.name}
                        className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
                    />
                ) : (
                    <span className="text-5xl select-none">{pet.speciesIcon}</span>
                )}
                {/* Status badge */}
                <div className="absolute bottom-2 right-2">
                    <Badge variant="outline" className={`text-xs font-medium ${status.className}`}>
                        {status.label}
                    </Badge>
                </div>
            </div>

            <CardHeader className="pb-2 pt-4">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="text-lg font-semibold leading-tight text-neutral-900">{pet.name}</p>
                        <p className="text-sm text-neutral-500">
                            {pet.species} · {pet.breed}
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pb-5">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div className="flex items-center gap-2 text-neutral-600">
                        <CalendarDays className="h-4 w-4 shrink-0 text-neutral-400" />
                        <span>{pet.age} yr{pet.age !== 1 ? 's' : ''} old</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-600">
                        <Scale className="h-4 w-4 shrink-0 text-neutral-400" />
                        <span>{pet.weight} kg</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-600">
                        <VenusAndMars className="h-4 w-4 shrink-0 text-neutral-400" />
                        <span>{pet.gender}</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-600">
                        <Ruler className="h-4 w-4 shrink-0 text-neutral-400" />
                        <span>{pet.color}</span>
                    </div>
                </dl>

                {pet.lastVisit && (
                    <p className="mt-3 text-xs text-neutral-400">
                        Last visit: <span className="font-medium text-neutral-500">{pet.lastVisit}</span>
                    </p>
                )}

                {/* Action buttons */}
                <div className="mt-4 flex gap-2">
                        {pet.qrToken && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs"
                                onClick={() => onShowQr(pet)}
                            >
                                <QrCode className="h-3.5 w-3.5 mr-1" />
                                View QR
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => onShowRecord(pet)}
                        >
                            <ClipboardList className="h-3.5 w-3.5 mr-1" />
                            Pet Record
                        </Button>
                    </div>
            </CardContent>
        </Card>
    );
}

export default function MyPets({ pets }: MyPetsProps) {
    const hasPets = pets.length > 0;

    // QR modal
    const [qrPet, setQrPet] = useState<Pet | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if (qrPet?.qrToken && canvasRef.current) {
            const url = `${window.location.origin}/scan/${qrPet.qrToken}`;
            QRCodeLib.toCanvas(canvasRef.current, url, { width: 220, margin: 2 });
        }
    }, [qrPet]);

    // Records modal
    const [recordPet, setRecordPet] = useState<Pet | null>(null);
    const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [recordLoading, setRecordLoading] = useState(false);

    const handleShowRecord = async (pet: Pet) => {
        setRecordPet(pet);
        setVaccinations([]);
        setConsultations([]);
        setRecordLoading(true);
        try {
            const res = await fetch(`/owner/pets/${pet.id}/record`, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data = await res.json();
            setVaccinations(data.vaccinations ?? []);
            setConsultations(data.consultations ?? []);
        } finally {
            setRecordLoading(false);
        }
    };

    return (
        <OwnerLayout
            title="My Pets"
            description="View your registered pets and their health records."
        >
            <Head title="My Pets" />

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
                        <PetCard key={pet.id} pet={pet} onShowQr={setQrPet} onShowRecord={handleShowRecord} />
                    ))}
                </div>
            )}

            {/* QR Modal */}
            {qrPet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setQrPet(null)}>
                    <div className="relative w-full max-w-xs rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setRecordPet(null)}>
                    <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b px-5 py-4">
                            <div>
                                <p className="text-lg font-semibold text-neutral-900">{recordPet.name}'s Record</p>
                                <p className="text-sm text-neutral-500">{recordPet.species} · {recordPet.breed}</p>
                            </div>
                            <button onClick={() => setRecordPet(null)} className="rounded-full p-1 text-neutral-400 hover:text-neutral-700">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
                            {recordLoading ? (
                                <div className="py-10 text-center text-neutral-400">Loading...</div>
                            ) : (
                                <>
                                    {/* Vaccinations */}
                                    <section>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Syringe className="h-4 w-4 text-emerald-600" />
                                            <h3 className="text-sm font-semibold text-neutral-800">Vaccinations</h3>
                                        </div>
                                        {vaccinations.length > 0 ? (
                                            <div className="space-y-2">
                                                {vaccinations.map((v, i) => (
                                                    <div key={i} className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5">
                                                        <p className="text-sm font-medium text-neutral-800">{v.vaccine}</p>
                                                        <p className="text-xs text-neutral-500 mt-0.5">Given: {v.date} · Next due: {v.nextDue}</p>
                                                    </div>
                                                ))}
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
                                            <div className="space-y-2">
                                                {consultations.map((c, i) => (
                                                    <div key={i} className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5">
                                                        <div className="flex items-center justify-between">
                                                            <Badge variant="outline" className="text-xs">{c.type}</Badge>
                                                            <span className="text-xs text-neutral-400">{c.date}</span>
                                                        </div>
                                                        {c.complaint && <p className="text-xs text-neutral-600 mt-1"><span className="font-medium">Complaint:</span> {c.complaint}</p>}
                                                        {c.diagnosis && <p className="text-xs text-neutral-600"><span className="font-medium">Diagnosis:</span> {c.diagnosis}</p>}
                                                    </div>
                                                ))}
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
        </OwnerLayout>
    );
}
