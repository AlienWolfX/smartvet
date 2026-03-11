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
    Sparkles,
    VenusAndMars,
    Info,
} from 'lucide-react';

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
    isDemo?: boolean;
}

interface MyPetsProps {
    pets: Pet[];
    dummy: Pet | null;
}

const statusConfig: Record<string, { label: string; className: string }> = {
    Healthy:  { label: 'Healthy',  className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    Sick:     { label: 'Sick',     className: 'bg-red-50 text-red-700 border-red-200' },
    Recovery: { label: 'Recovery', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    Critical: { label: 'Critical', className: 'bg-red-100 text-red-800 border-red-300' },
};

function PetCard({ pet }: { pet: Pet }) {
    const status = statusConfig[pet.status] ?? { label: pet.status, className: 'bg-slate-50 text-slate-600 border-slate-200' };

    return (
        <Card className={`overflow-hidden transition-all hover:shadow-md ${pet.isDemo ? 'opacity-60 border-dashed' : ''}`}>
            {/* Card Header – species colour band */}
            <div className="relative h-24 bg-gradient-to-br from-[#0e4d3a] to-[#1a7a5e] flex items-center justify-center">
                {pet.imageUrl ? (
                    <img
                        src={pet.imageUrl}
                        alt={pet.name}
                        className="absolute inset-0 h-full w-full object-cover opacity-60"
                    />
                ) : (
                    <span className="text-5xl select-none">{pet.speciesIcon}</span>
                )}
                {pet.isDemo && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-slate-600">
                        <Sparkles className="h-3 w-3" />
                        Demo
                    </div>
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
            </CardContent>
        </Card>
    );
}

export default function MyPets({ pets, dummy }: MyPetsProps) {
    const hasPets = pets.length > 0;
    const displayPets = hasPets ? pets : dummy ? [dummy] : [];

    return (
        <OwnerLayout
            title="My Pets"
            description="View your registered pets and their health records."
        >
            <Head title="My Pets" />

            {!hasPets && dummy && (
                <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                        You don't have any pets linked yet. Ask your clinic to register your pets under your account.
                        The card below is a <strong>demo</strong> to show how it will look.
                    </span>
                </div>
            )}

            {displayPets.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {displayPets.map((pet) => (
                        <PetCard key={pet.id} pet={pet} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
                    <PawPrint className="h-12 w-12 text-neutral-300" />
                    <p className="mt-4 text-lg font-medium text-neutral-600">No pets yet</p>
                    <p className="mt-1 text-sm text-neutral-400">Your registered pets will appear here.</p>
                </div>
            )}
        </OwnerLayout>
    );
}
