import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import {
    Heart,
    Syringe,
    FileText,
    User,
    CheckCircle,
    Clock,
    AlertCircle,
} from 'lucide-react';

interface PetProfile {
    name: string;
    species: string;
    breed: string;
    age: number | null;
    gender: string;
    color: string | null;
    microchipId: string | null;
    imageUrl: string | null;
    status: string;
}

interface Vaccination {
    vaccine: string;
    date: string;
    nextDue: string;
}

interface Consultation {
    type: string;
    date: string;
    complaint: string | null;
    diagnosis: string | null;
}

interface Props {
    pet: PetProfile;
    owner: { name: string };
    vaccinations: Vaccination[];
    consultations: Consultation[];
}

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });

const isOverdue = (dateStr: string) => new Date(dateStr) < new Date();

export default function PetScan({ pet, owner, vaccinations, consultations }: Props) {
    const statusColor =
        pet.status === 'active'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-neutral-100 text-neutral-500 border-neutral-200';

    return (
        <>
            <Head title={`${pet.name} — SmartVet`} />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
                <div className="mx-auto max-w-lg space-y-5">

                    {/* Header branding */}
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 text-slate-600">
                            <img src="/images/logo.png" alt="SmartVet" className="h-8 w-auto" />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Pet Health Passport</p>
                    </div>

                    {/* Pet identity card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        {pet.imageUrl ? (
                            <img
                                src={pet.imageUrl}
                                alt={pet.name}
                                className="w-full h-48 object-cover object-[center_30%]"
                            />
                        ) : (
                            <div className="w-full h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                <Heart className="h-12 w-12 text-slate-300" />
                            </div>
                        )}

                        <div className="p-5 space-y-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">{pet.name}</h1>
                                    <p className="text-slate-500 text-sm">
                                        {pet.species} · {pet.breed}
                                    </p>
                                </div>
                                <Badge className={`capitalize ${statusColor}`}>
                                    {pet.status}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                {pet.age !== null && (
                                    <div>
                                        <span className="text-slate-400">Age</span>
                                        <p className="font-medium text-slate-700">{pet.age} year{pet.age !== 1 ? 's' : ''}</p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-slate-400">Gender</span>
                                    <p className="font-medium text-slate-700 capitalize">{pet.gender}</p>
                                </div>
                                {pet.color && (
                                    <div>
                                        <span className="text-slate-400">Color</span>
                                        <p className="font-medium text-slate-700">{pet.color}</p>
                                    </div>
                                )}
                                {pet.microchipId && (
                                    <div>
                                        <span className="text-slate-400">Microchip</span>
                                        <p className="font-medium text-slate-700 font-mono text-xs">{pet.microchipId}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 pt-1 text-sm text-slate-500 border-t border-slate-100 pt-3">
                                <User className="h-4 w-4 text-slate-400" />
                                Owner: <span className="font-medium text-slate-700">{owner.name}</span>
                            </div>
                        </div>
                    </div>

                    {/* Vaccinations */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                        <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-3">
                            <Syringe className="h-4 w-4 text-blue-500" />
                            Vaccinations
                        </h2>
                        {vaccinations.length === 0 ? (
                            <p className="text-slate-400 text-sm">No vaccination records yet.</p>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {vaccinations.map((v, i) => {
                                    const overdue = isOverdue(v.nextDue);
                                    return (
                                        <div key={i} className="py-2.5 flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-slate-800 text-sm">{v.vaccine}</p>
                                                <p className="text-xs text-slate-400">Given: {formatDate(v.date)}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`flex items-center gap-1 text-xs font-medium ${overdue ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {overdue
                                                        ? <AlertCircle className="h-3.5 w-3.5" />
                                                        : <CheckCircle className="h-3.5 w-3.5" />}
                                                    {overdue ? 'Overdue' : 'Current'}
                                                </div>
                                                <p className="text-xs text-slate-400">Next: {formatDate(v.nextDue)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Consultation history */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                        <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-3">
                            <FileText className="h-4 w-4 text-violet-500" />
                            Visit History
                        </h2>
                        {consultations.length === 0 ? (
                            <p className="text-slate-400 text-sm">No consultation records yet.</p>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {consultations.map((c, i) => (
                                    <div key={i} className="py-2.5">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-slate-800 text-sm capitalize">{c.type}</p>
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(c.date)}
                                            </span>
                                        </div>
                                        {c.complaint && (
                                            <p className="text-xs text-slate-500 mt-0.5">Complaint: {c.complaint}</p>
                                        )}
                                        {c.diagnosis && (
                                            <p className="text-xs text-slate-600 mt-0.5 font-medium">Dx: {c.diagnosis}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <p className="text-center text-xs text-slate-400 pb-4">
                        Powered by SmartVet · Pet Health Records Platform
                    </p>
                </div>
            </div>
        </>
    );
}
