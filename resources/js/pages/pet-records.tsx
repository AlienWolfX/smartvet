import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Modal,
    ModalContent,
    ModalDescription,
    ModalFooter,
    ModalHeader,
    ModalTitle,
    ModalTrigger,
} from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import AdminLayout from '@/layouts/admin-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { useToast } from '@/hooks/use-toast';
import {
    Heart,
    Search,
    Filter,
    Plus,
    Phone,
    MapPin,
    Activity,
    AlertCircle,
    CheckCircle,
    Clock,
    Syringe,
    Pill,
    FileText,
    Download,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Trash2,
    QrCode,
    X,
} from 'lucide-react';
import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import AddressSelect, { type AddressData } from '@/components/address-select';
import { getBreedsForSpecies } from '@/config/pet-breeds';
import QRCode from 'qrcode';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

interface Species {
    id: string;
    name: string;
    icon: string;
}

interface Pet {
    id: string;
    name: string;
    species: string;
    speciesIcon: string;
    breed: string;
    age: number;
    weight: number;
    gender: string;
    color: string;
    imageUrl: string | null;
    qrUrl: string | null;
    status: string;
    lastVisit: string;
    registrationDate: string;
    owner: {
        name: string;
        phone: string;
        email: string;
        address: string;
        street: string;
        barangay: string;
        city: string;
        province: string;
        zipCode: string;
        emergencyContact: string;
    };
    medicalHistory: any[];
    vaccinations: any[];
    allergies: string[];
    currentMedications: any[];
}

interface NewPetQr {
    petId: string;
    name: string;
    species: string;
    breed: string;
    qrUrl: string;
}

interface Props {
    pets: Pet[];
    species: Species[];
    newPetQr?: NewPetQr | null;
}

const formatPeso = (value: number) =>
    `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const extractQrToken = (value: string | null | undefined): string | null => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    // If this is already a token, use it as-is.
    if (!trimmed.includes('/')) {
        return trimmed;
    }

    try {
        const pathParts = new URL(trimmed).pathname.split('/').filter(Boolean);
        return pathParts[pathParts.length - 1] ?? null;
    } catch {
        const parts = trimmed.split('/').filter(Boolean);
        return parts[parts.length - 1] ?? null;
    }
};

const resolveQrPreviewUrl = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    const token = extractQrToken(trimmed);
    return token ? `${window.location.origin}/scan/${token}` : null;
};

const getVaccinationStatusColor = (status: string) => {
    switch (status) {
        case 'current':
            return 'border-transparent bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200';
        case 'due-soon':
            return 'border-transparent bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200';
        case 'overdue':
        case 'pending':
            return 'border-transparent bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200';
        default:
            return 'border-transparent bg-neutral-50 text-neutral-700 dark:border-neutral-400/30 dark:bg-neutral-500/10 dark:text-neutral-200';
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'current':
            return <CheckCircle className="h-4 w-4" />;
        case 'due-soon':
            return <Clock className="h-4 w-4" />;
        case 'overdue':
        case 'pending':
            return <AlertCircle className="h-4 w-4" />;
        default:
            return <Activity className="h-4 w-4" />;
    }
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard.url(),
    },
    {
        title: 'Pet Records',
        href: '/pet-records',
    },
];

export default function PetRecords({ pets, species, newPetQr }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSpecies, setSelectedSpecies] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const { auth } = usePage<SharedData>().props;
    const clinicName = (auth.user as { clinic_name?: string })?.clinic_name || 'SmartVet';
    const clinicLogo = (auth.user as { clinic_logo?: string })?.clinic_logo;
    const themeColor = (auth.user as { theme_color?: string })?.theme_color || '#0f172a';
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [qrCardPet, setQrCardPet] = useState<NewPetQr | null>(newPetQr ?? null);
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const qrToken = extractQrToken(qrCardPet?.qrUrl);
        if (qrToken && qrCanvasRef.current) {
            QRCode.toCanvas(qrCanvasRef.current, qrToken, {
                width: 180,
                margin: 1,
                color: { dark: '#0f172a', light: '#ffffff' },
            });
        }
    }, [qrCardPet]);

    const downloadQrCard = async () => {
        if (!qrCardPet || !qrCanvasRef.current) return;

        const qrSize = 180;
        const padding = 24;
        const headerH = 110;
        const footerH = 100;
        const cardW = qrSize + padding * 2;
        const cardH = headerH + qrSize + padding * 2 + footerH;
        const scale = 2;

        const canvas = document.createElement('canvas');
        canvas.width = cardW * scale;
        canvas.height = cardH * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.scale(scale, scale);

        // Rounded rect helper
        const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.arcTo(x + w, y, x + w, y + r, r);
            ctx.lineTo(x + w, y + h - r);
            ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
            ctx.lineTo(x + r, y + h);
            ctx.arcTo(x, y + h, x, y + h - r, r);
            ctx.lineTo(x, y + r);
            ctx.arcTo(x, y, x + r, y, r);
            ctx.closePath();
        };

        // Card background (white, rounded)
        roundRect(0, 0, cardW, cardH, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.save();
        roundRect(0, 0, cardW, cardH, 16);
        ctx.clip();

        // Header background
        ctx.fillStyle = themeColor;
        ctx.fillRect(0, 0, cardW, headerH);

        // Clinic name / logo + subtitle
        const subtitleY = headerH - 14;
        const nameAreaH = headerH - 28; // space above subtitle

        if (clinicLogo) {
            await new Promise<void>((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    const maxH = 36, maxW = cardW - padding * 2;
                    const ratio = Math.min(maxW / img.width, maxH / img.height);
                    const dw = img.width * ratio, dh = img.height * ratio;
                    ctx.drawImage(img, (cardW - dw) / 2, (nameAreaH - dh) / 2, dw, dh);
                    resolve();
                };
                img.onerror = () => resolve();
                img.src = `/storage/${clinicLogo}`;
            });
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(clinicName, cardW / 2, nameAreaH / 2 + 6);
        }

        // "Veterinary Clinic" subtitle
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('VETERINARY CLINIC', cardW / 2, subtitleY);

        // QR canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(padding, headerH + padding, qrSize, qrSize);
        ctx.drawImage(qrCanvasRef.current, padding, headerH + padding, qrSize, qrSize);

        // Footer text
        const footerStart = headerH + qrSize + padding * 2;
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(qrCardPet.name, cardW / 2, footerStart + 20);

        ctx.fillStyle = '#64748b';
        ctx.font = '12px sans-serif';
        ctx.fillText(`${qrCardPet.species} · ${qrCardPet.breed}`, cardW / 2, footerStart + 40);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px monospace';
        ctx.fillText(qrCardPet.petId, cardW / 2, footerStart + 60);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px sans-serif';
        ctx.fillText('Scan to view pet profile & visit history', cardW / 2, footerStart + 78);

        ctx.restore();

        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `${qrCardPet.name.replace(/\s+/g, '_')}_qr_card.png`;
        a.click();
    };
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const [exportSearch, setExportSearch] = useState('');
    const [selectedPetForExport, setSelectedPetForExport] = useState<string>('');
    const [exportPetPage, setExportPetPage] = useState(1);
    const PETS_PER_PAGE = 3;
    const [exportFilters, setExportFilters] = useState({
        exportType: 'all' as 'all' | 'individual',
        species: 'all',
        status: 'all',
        dateFrom: '',
        dateTo: '',
        includeConsultations: true,
        includeVaccinations: true,
        includeOwnerInfo: true,
    });
    const { success, error } = useToast();
    const [deletingPet, setDeletingPet] = useState<Pet | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [breedSelection, setBreedSelection] = useState('');
    const [customBreed, setCustomBreed] = useState('');
    const docInputRef = useRef<HTMLInputElement>(null);

    const handleDeletePet = useCallback((pet: Pet) => {
        setIsDeleting(true);
        router.delete(`/pet-records/${pet.id}`, {
            onSuccess: () => {
                setDeletingPet(null);
                setIsDeleting(false);
                success('Pet record deleted successfully.');
            },
            onError: () => {
                setIsDeleting(false);
                error('Failed to delete pet record. Please try again.');
            },
        });
    }, [router, success, error]);


    const { data, setData, reset } = useForm({
        petName: '',
        species: '',
        breed: '',
        age: '',
        weight: '',
        gender: '',
        color: '',
        petImage: null as File | null,
        ownerName: '',
        phone: '',
        email: '',
        region: '',
        province: '',
        city: '',
        barangay: '',
        street: '',
        zipCode: '',
        qrToken: '',
    });

    const [petDocs, setPetDocs] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const importToken = params.get('importToken')?.trim();

        if (importToken) {
            setData('qrToken', importToken);
            setIsAddModalOpen(true);
        }
    }, [setData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormErrors({});

        const fd = new FormData();
        fd.append('petName', data.petName);
        fd.append('species', data.species);
        fd.append('breed', data.breed);
        fd.append('age', data.age);
        fd.append('weight', data.weight);
        fd.append('gender', data.gender);
        fd.append('color', data.color);
        fd.append('ownerName', data.ownerName);
        fd.append('phone', data.phone);
        fd.append('email', data.email);
        fd.append('region', data.region);
        fd.append('province', data.province);
        fd.append('city', data.city);
        fd.append('barangay', data.barangay);
        fd.append('street', data.street);
        fd.append('zipCode', data.zipCode);
        if (data.qrToken) fd.append('qrToken', data.qrToken);
        if (data.petImage) fd.append('petImage', data.petImage);
        petDocs.forEach(f => fd.append('petDocuments[]', f));

        router.post('/pet-records', fd, {
            onSuccess: () => {
                reset();
                setPetDocs([]);
                setFormErrors({});
                setBreedSelection('');
                setCustomBreed('');
                setIsAddModalOpen(false);
                setIsSubmitting(false);
                success('Pet registered successfully!');
                setTimeout(() => router.reload(), 250);
            },
            onError: (errs: Record<string, any>) => {
                setIsSubmitting(false);

                const normalizedErrors: Record<string, string> = Object.fromEntries(
                    Object.entries(errs).map(([key, value]) => {
                        let message = '';

                        if (Array.isArray(value) && value.length > 0) {
                            message = value[0];
                        } else if (typeof value === 'string') {
                            message = value;
                        } else if (value && typeof value === 'object') {
                            const first = Object.values(value)[0];
                            message = Array.isArray(first) ? first[0] : String(first);
                        } else {
                            message = 'Invalid value.';
                        }

                        return [key, message];
                    })
                );

                setFormErrors(normalizedErrors);

                // Top-level flash messages for immediate visible feedback
                Object.values(normalizedErrors).forEach((msg) => {
                    if (msg) error(msg);
                });

                const firstInvalidField = Object.keys(normalizedErrors)[0];
                if (firstInvalidField) {
                    const inputEl = document.querySelector(`[name="${firstInvalidField}"]`) as HTMLElement;
                    if (inputEl) {
                        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        inputEl.focus();
                    }
                }
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const filteredPets = useMemo(() => {
        return pets.filter((pet) => {
            const matchesSearch =
                pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pet.owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pet.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pet.id.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesSpecies =
                selectedSpecies === 'all' || pet.species.toLowerCase() === selectedSpecies;

            const matchesStatus =
                selectedStatus === 'all' || pet.status === selectedStatus;

            return matchesSearch && matchesSpecies && matchesStatus;
        });
    }, [pets, searchTerm, selectedSpecies, selectedStatus]);

    // Reset to page 1 when filters change
    const totalPages = Math.ceil(filteredPets.length / ITEMS_PER_PAGE);
    const paginatedPets = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredPets.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredPets, currentPage]);

    // Reset page when filters change
    useMemo(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedSpecies, selectedStatus]);

    const petStats = useMemo(() => {
        const totalPets = pets.length;
        const activePets = pets.filter(pet => pet.status === 'active').length;
        const upcomingVaccinations = pets.reduce((count, pet) => {
            return count + pet.vaccinations.filter(v => v.status === 'due-soon' || v.status === 'overdue').length;
        }, 0);

        return { totalPets, activePets, upcomingVaccinations };
    }, [pets]);

    const openExportModal = () => {
        setExportFilters({
            exportType: 'all',
            species: selectedSpecies,
            status: selectedStatus,
            dateFrom: '',
            dateTo: '',
            includeConsultations: true,
            includeVaccinations: true,
            includeOwnerInfo: true,
        });
        setExportSearch('');
        setSelectedPetForExport('');
        setExportPetPage(1);
        setIsExporting(false);
        setIsExportModalOpen(true);
    };

    const closeExportModal = () => {
        setIsExporting(false);
        setIsExportModalOpen(false);
    };

    const filteredPetsForExport = useMemo(() => {
        let filtered = pets;
        if (exportSearch.trim()) {
            const term = exportSearch.toLowerCase();
            filtered = pets.filter((pet) =>
                pet.name.toLowerCase().includes(term) ||
                pet.owner.name.toLowerCase().includes(term) ||
                pet.id.toLowerCase().includes(term)
            );
        }
        return filtered;
    }, [pets, exportSearch]);

    const paginatedPetsForExport = useMemo(() => {
        const startIndex = (exportPetPage - 1) * PETS_PER_PAGE;
        return filteredPetsForExport.slice(startIndex, startIndex + PETS_PER_PAGE);
    }, [filteredPetsForExport, exportPetPage]);

    const totalExportPages = Math.ceil(filteredPetsForExport.length / PETS_PER_PAGE);

    const handleExport = (e: React.FormEvent) => {
        e.preventDefault();
        if (isExporting) return;

        if (exportFilters.exportType === 'individual' && !selectedPetForExport) {
            error('Please select a pet to export');
            return;
        }

        setIsExporting(true);

        const params = new URLSearchParams();

        if (exportFilters.exportType === 'individual') {
            params.append('type', 'individual');
            params.append('pet_id', selectedPetForExport);
            if (exportFilters.includeConsultations) params.append('include_consultations', '1');
            if (exportFilters.includeVaccinations) params.append('include_vaccinations', '1');
            if (exportFilters.includeOwnerInfo) params.append('include_owner_info', '1');
        } else {
            if (exportFilters.species && exportFilters.species !== 'all') {
                params.append('species', exportFilters.species);
            }
            if (exportFilters.status && exportFilters.status !== 'all') {
                params.append('status', exportFilters.status);
            }
            if (exportFilters.dateFrom) {
                params.append('date_from', exportFilters.dateFrom);
            }
            if (exportFilters.dateTo) {
                params.append('date_to', exportFilters.dateTo);
            }
        }

        const query = params.toString();
        const url = query ? `/pet-records/export?${query}` : '/pet-records/export';

        window.location.href = url;

        setTimeout(() => {
            setIsExporting(false);
            setIsExportModalOpen(false);
            success('Export started successfully!');
        }, 1500);
    };

    return (
        <AdminLayout
            breadcrumbs={breadcrumbs}
            title="Pet Records"
            description="Comprehensive pet health records, vaccination tracking, and medical history management."
        >
            <Head title="Pet Records" />

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-3">
                <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pets</CardTitle>
                        <Heart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{petStats.totalPets}</div>
                        <p className="text-xs text-muted-foreground">
                            Registered in system
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
                        <Activity className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{petStats.activePets}</div>
                        <p className="text-xs text-muted-foreground">
                            Currently under care
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vaccination Alerts</CardTitle>
                        <Syringe className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{petStats.upcomingVaccinations}</div>
                        <p className="text-xs text-muted-foreground">
                            Due soon or overdue
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card className="border border-white/70 bg-white/95 shadow-lg dark:border-white/5 dark:bg-neutral-900">
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Pet Records</CardTitle>
                            <CardDescription>
                                Manage pet health records, vaccinations, and medical history
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.visit('/pet-records/visibility')}
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                History Visibility
                            </Button>
                            <Button variant="outline" size="sm" onClick={openExportModal}>
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                            <Modal open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                                <ModalTrigger asChild>
                                    <Button size="sm" className="text-white" style={{ backgroundColor: themeColor, borderColor: themeColor }}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Pet
                                    </Button>
                                </ModalTrigger>
                                <ModalContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                    <ModalHeader>
                                        <ModalTitle>Add New Pet Record</ModalTitle>
                                        <ModalDescription>
                                            Register a new pet in the system with complete information.
                                        </ModalDescription>
                                        {data.qrToken && (
                                            <div className="mt-2 space-y-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-3 text-xs font-medium text-blue-800">
                                                <div className="inline-flex items-center gap-2">
                                                    <QrCode className="h-3.5 w-3.5" />
                                                    Imported QR token
                                                </div>
                                                <Input
                                                    name="qrToken"
                                                    value={data.qrToken}
                                                    readOnly
                                                    className="h-9 border-blue-200 bg-white font-mono text-[11px] text-blue-900"
                                                />
                                                {formErrors.qrToken && <div className="text-xs font-normal text-red-600">{formErrors.qrToken}</div>}
                                            </div>
                                        )}
                                        <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
                                            {clinicLogo ? (
                                                <img src={`/storage/${clinicLogo}`} alt={clinicName} className="h-4 w-4 rounded object-cover" />
                                            ) : (
                                                <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-600 text-[9px] font-bold text-white">
                                                    {clinicName.substring(0, 2).toUpperCase()}
                                                </span>
                                            )}
                                            Adding to <span className="font-semibold">{clinicName}</span>
                                        </div>
                                    </ModalHeader>
                                    <form onSubmit={handleSubmit}>
                                        {Object.keys(formErrors).length > 0 && (
                                            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700 mb-3">
                                                {/* <p className="text-sm font-semibold">Please fix the following errors:</p>
                                                <ul className="list-disc pl-5 mt-1 text-xs">
                                                    {Object.entries(formErrors).map(([field, message]) => (
                                                        <li key={field} className="truncate">{field}: {message}</li>
                                                    ))}
                                                </ul> */}
                                            </div>
                                        )}
                                        <div className="grid gap-4 py-4">
                                            {/* Pet Basic Information */}
                                            <div className="space-y-4">
                                                <h4 className="font-semibold text-sm">Pet Information</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Pet Name *</label>
                                                        <Input
                                                            name="petName"
                                                            placeholder="e.g., Buddy"
                                                            value={data.petName}
                                                            onChange={(e) => setData('petName', e.target.value)}
                                                            className={formErrors.petName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                                                            required
                                                        />
                                                        {formErrors.petName && <div className="text-red-500 text-xs">{formErrors.petName}</div>}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Species *</label>
                                                        <Select name="species" value={data.species} onValueChange={(value) => { setData(prev => ({ ...prev, species: value, breed: '' })); setBreedSelection(''); setCustomBreed(''); }}>
                                                            <SelectTrigger className={formErrors.species ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}>
                                                                <SelectValue placeholder="Select species" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Dog">Dog</SelectItem>
                                                                <SelectItem value="Cat">Cat</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        {formErrors.species && <div className="text-red-500 text-xs">{formErrors.species}</div>}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Breed</label>
                                                        {data.species ? (
                                                            <>
                                                                <Select value={breedSelection} onValueChange={(value) => {
                                                                    setBreedSelection(value);
                                                                    if (value === '__other') {
                                                                        setData('breed', customBreed);
                                                                    } else {
                                                                        setData('breed', value);
                                                                        setCustomBreed('');
                                                                    }
                                                                }}>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select breed" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {getBreedsForSpecies(data.species).map((breed) => (
                                                                            <SelectItem key={breed} value={breed}>{breed}</SelectItem>
                                                                        ))}
                                                                        <SelectItem value="__other">Other (specify)</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                {breedSelection === '__other' && (
                                                                    <Input
                                                                        placeholder="Enter breed name"
                                                                        className="mt-2"
                                                                        value={customBreed}
                                                                        onChange={(e) => {
                                                                            setCustomBreed(e.target.value);
                                                                            setData('breed', e.target.value);
                                                                        }}
                                                                    />
                                                                )}
                                                            </>
                                                        ) : (
                                                            <Input
                                                                placeholder="Select a species first"
                                                                disabled
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Age (years)</label>
                                                        <Input
                                                            type="number"
                                                            placeholder="e.g., 3"
                                                            value={data.age}
                                                            onChange={(e) => setData('age', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Weight (kg)</label>
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            placeholder="e.g., 28.5"
                                                            value={data.weight}
                                                            onChange={(e) => setData('weight', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Gender *</label>
                                                        <Select name="gender" value={data.gender} onValueChange={(value) => setData('gender', value)}>
                                                            <SelectTrigger className={formErrors.gender ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}>
                                                                <SelectValue placeholder="Select gender" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="male">Male</SelectItem>
                                                                <SelectItem value="female">Female</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        {formErrors.gender && <div className="text-red-500 text-xs">{formErrors.gender}</div>}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Color/Markings</label>
                                                        <Input
                                                            placeholder="e.g., Golden, Black and White"
                                                            value={data.color}
                                                            onChange={(e) => setData('color', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Pet Photo (Optional)</label>
                                                    <div className="relative">
                                                        <Input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0] || null;
                                                                setData('petImage', file);
                                                            }}
                                                            className="hidden"
                                                            id="petImage"
                                                        />
                                                        <label
                                                            htmlFor="petImage"
                                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-transparent hover:bg-gray-50/50 dark:hover:bg-gray-800/30 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
                                                        >
                                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                                {data.petImage ? (
                                                                    <div className="text-center">
                                                                        <div className="text-green-600 mb-2">
                                                                            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                            </svg>
                                                                        </div>
                                                                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                                            {data.petImage.name}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                            Click to change photo
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-center">
                                                                        <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400 mx-auto" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                                                        </svg>
                                                                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                                                        </p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                            PNG, JPG or GIF (MAX. 5MB)
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Medical Documents (Optional)</label>
                                                    <input
                                                        ref={docInputRef}
                                                        type="file"
                                                        id="petDocInput"
                                                        multiple
                                                        accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const picked = Array.from(e.target.files ?? []);
                                                            const merged = [...petDocs];
                                                            for (const file of picked) {
                                                                if (merged.length >= 3) break;
                                                                if (!merged.some(f => f.name === file.name && f.size === file.size)) {
                                                                    merged.push(file);
                                                                }
                                                            }
                                                            setPetDocs(merged);
                                                            if (docInputRef.current) docInputRef.current.value = '';
                                                        }}
                                                    />
                                                    <label
                                                        htmlFor="petDocInput"
                                                        className={`flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm transition-colors ${
                                                            petDocs.length >= 3
                                                                ? 'cursor-not-allowed border-neutral-200 text-neutral-400'
                                                                : 'cursor-pointer border-neutral-300 text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50'
                                                        }`}
                                                        onClick={(e) => { if (petDocs.length >= 3) e.preventDefault(); }}
                                                    >
                                                        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                        {petDocs.length >= 3 ? 'Maximum 3 files reached' : `Add file${petDocs.length > 0 ? ` (${petDocs.length}/3)` : 's'}`}
                                                    </label>
                                                    <p className="text-xs text-muted-foreground">
                                                        Up to 3 files — X-rays, lab results, photos, or documents (max 10MB each).
                                                    </p>
                                                    {formErrors.petDocuments && <div className="text-red-500 text-xs">{formErrors.petDocuments}</div>}
                                                    {petDocs.length > 0 && (
                                                        <div className="space-y-1 rounded-md border border-neutral-200 p-2 text-xs text-neutral-600">
                                                            {petDocs.map((file, index) => (
                                                                <div key={`${file.name}-${index}`} className="flex items-center gap-2">
                                                                    <span className="flex-1 truncate">{file.name}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setPetDocs(petDocs.filter((_, i) => i !== index))}
                                                                        className="shrink-0 text-neutral-400 hover:text-red-500"
                                                                    >
                                                                        <X className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Owner Information */}
                                            <div className="space-y-4">
                                                <h4 className="font-semibold text-sm">Owner Information</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Owner Name *</label>
                                                        <Input
                                                            name="ownerName"
                                                            placeholder="e.g., John Smith"
                                                            value={data.ownerName}
                                                            onChange={(e) => setData('ownerName', e.target.value)}
                                                            className={formErrors.ownerName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                                                            required
                                                        />
                                                        {formErrors.ownerName && <div className="text-red-500 text-xs">{formErrors.ownerName}</div>}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Phone Number *</label>
                                                        <Input
                                                            name="phone"
                                                            placeholder="e.g., 09171234567"
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            value={data.phone}
                                                            onChange={(e) => {
                                                                // Only allow digits
                                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                                setData('phone', val);
                                                            }}
                                                            className={formErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                                                            required
                                                        />
                                                        {formErrors.phone && <div className="text-red-500 text-xs">{formErrors.phone}</div>}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Email *</label>
                                                        <Input
                                                            type="email"
                                                            placeholder="owner@email.com"
                                                            value={data.email}
                                                            onChange={(e) => setData('email', e.target.value)}
                                                            required
                                                            className={formErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                                                        />
                                                        {formErrors.email && <div className="text-red-500 text-xs">{formErrors.email}</div>}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Address *</label>
                                                    <AddressSelect
                                                        value={{
                                                            region: data.region,
                                                            province: data.province,
                                                            city: data.city,
                                                            barangay: data.barangay,
                                                            street: data.street,
                                                            zipCode: data.zipCode,
                                                        }}
                                                        onChange={(addr: AddressData) => {
                                                            setData(prev => ({
                                                                ...prev,
                                                                region: addr.region,
                                                                province: addr.province,
                                                                city: addr.city,
                                                                barangay: addr.barangay,
                                                                street: addr.street,
                                                                zipCode: addr.zipCode,
                                                            }));
                                                        }}
                                                        errors={{
                                                            region: formErrors.region,
                                                            province: formErrors.province,
                                                            city: formErrors.city,
                                                            barangay: formErrors.barangay,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <ModalFooter>
                                            <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); reset(); setPetDocs([]); setFormErrors({}); }}>
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={isSubmitting} className="text-white" style={{ backgroundColor: themeColor, borderColor: themeColor }}>
                                                {isSubmitting ? 'Adding...' : 'Add Pet'}
                                            </Button>
                                        </ModalFooter>
                                    </form>
                                </ModalContent>
                            </Modal>

                            {/* Export Modal */}
                            <Modal
                                open={isExportModalOpen}
                                onOpenChange={(open) => {
                                    if (!open) closeExportModal();
                                }}
                            >
                                <ModalContent className="max-w-md">
                                    <ModalHeader>
                                        <ModalTitle>Export Pet Records</ModalTitle>
                                        <ModalDescription>
                                            Choose which records to include in the Excel export.
                                        </ModalDescription>
                                    </ModalHeader>
                                    <form onSubmit={handleExport}>
                                        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Export Type</label>
                                                <Select
                                                    value={exportFilters.exportType}
                                                    onValueChange={(value: 'all' | 'individual') => {
                                                        setExportFilters((prev) => ({ ...prev, exportType: value }));
                                                        setSelectedPetForExport('');
                                                        setExportSearch('');
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select export type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Records</SelectItem>
                                                        <SelectItem value="individual">Individual Pet</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-neutral-500">
                                                    {exportFilters.exportType === 'all'
                                                        ? 'Export a summary list of all pets'
                                                        : 'Export detailed records for a specific pet'}
                                                </p>
                                            </div>

                                            {exportFilters.exportType === 'individual' && (
                                                <>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Search Pet</label>
                                                        <div className="relative">
                                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                placeholder="Search by pet name, owner, or ID..."
                                                                value={exportSearch}
                                                                onChange={(e) => {
                                                                    setExportSearch(e.target.value);
                                                                    setExportPetPage(1);
                                                                }}
                                                                className="pl-8"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-sm font-medium">Select Pet *</label>
                                                            <span className="text-xs text-neutral-500">
                                                                {filteredPetsForExport.length} pet(s) found
                                                            </span>
                                                        </div>
                                                        <div className="border rounded-md">
                                                            {filteredPetsForExport.length === 0 ? (
                                                                <p className="p-3 text-sm text-neutral-500 text-center">No pets found</p>
                                                            ) : (
                                                                paginatedPetsForExport.map((pet) => (
                                                                    <div
                                                                        key={pet.id}
                                                                        className={cn(
                                                                            "flex items-center justify-between p-2 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 border-b last:border-b-0",
                                                                            selectedPetForExport === pet.id && "bg-blue-50 dark:bg-blue-900/20"
                                                                        )}
                                                                        onClick={() => setSelectedPetForExport(pet.id)}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <Checkbox
                                                                                checked={selectedPetForExport === pet.id}
                                                                                onCheckedChange={() => setSelectedPetForExport(pet.id)}
                                                                            />
                                                                            <div>
                                                                                <p className="text-sm font-medium">{pet.name}</p>
                                                                                <p className="text-xs text-neutral-500">{pet.species} • {pet.owner.name}</p>
                                                                            </div>
                                                                        </div>
                                                                        <span className="text-xs text-neutral-400">{pet.id}</span>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                        {totalExportPages > 1 && (
                                                            <div className="flex items-center justify-between pt-2">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setExportPetPage((p) => Math.max(1, p - 1))}
                                                                    disabled={exportPetPage === 1}
                                                                >
                                                                    Previous
                                                                </Button>
                                                                <span className="text-xs text-neutral-500">
                                                                    Page {exportPetPage} of {totalExportPages}
                                                                </span>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setExportPetPage((p) => Math.min(totalExportPages, p + 1))}
                                                                    disabled={exportPetPage === totalExportPages}
                                                                >
                                                                    Next
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-3 rounded-md border p-3">
                                                        <label className="text-sm font-medium">Include in Export</label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id="includeConsultations"
                                                                    checked={exportFilters.includeConsultations}
                                                                    onCheckedChange={(checked) =>
                                                                        setExportFilters((prev) => ({
                                                                            ...prev,
                                                                            includeConsultations: !!checked,
                                                                        }))
                                                                    }
                                                                />
                                                                <label htmlFor="includeConsultations" className="text-sm font-normal cursor-pointer">
                                                                    Consultations
                                                                </label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id="includeVaccinations"
                                                                    checked={exportFilters.includeVaccinations}
                                                                    onCheckedChange={(checked) =>
                                                                        setExportFilters((prev) => ({
                                                                            ...prev,
                                                                            includeVaccinations: !!checked,
                                                                        }))
                                                                    }
                                                                />
                                                                <label htmlFor="includeVaccinations" className="text-sm font-normal cursor-pointer">
                                                                    Vaccinations
                                                                </label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id="includeOwnerInfo"
                                                                    checked={exportFilters.includeOwnerInfo}
                                                                    onCheckedChange={(checked) =>
                                                                        setExportFilters((prev) => ({
                                                                            ...prev,
                                                                            includeOwnerInfo: !!checked,
                                                                        }))
                                                                    }
                                                                />
                                                                <label htmlFor="includeOwnerInfo" className="text-sm font-normal cursor-pointer">
                                                                    Owner Info
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {exportFilters.exportType === 'all' && (
                                                <>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Species</label>
                                                        <Select
                                                            value={exportFilters.species}
                                                            onValueChange={(value) =>
                                                                setExportFilters((prev) => ({ ...prev, species: value }))
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="All species" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="all">All Species</SelectItem>
                                                                <SelectItem value="dog">Dog</SelectItem>
                                                                <SelectItem value="cat">Cat</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Status</label>
                                                        <Select
                                                            value={exportFilters.status}
                                                            onValueChange={(value) =>
                                                                setExportFilters((prev) => ({ ...prev, status: value }))
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="All status" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="all">All Status</SelectItem>
                                                                <SelectItem value="active">Active</SelectItem>
                                                                <SelectItem value="inactive">Inactive</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Date From</label>
                                                            <Input
                                                                type="date"
                                                                value={exportFilters.dateFrom}
                                                                onChange={(e) =>
                                                                    setExportFilters((prev) => ({
                                                                        ...prev,
                                                                        dateFrom: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Date To</label>
                                                            <Input
                                                                type="date"
                                                                value={exportFilters.dateTo}
                                                                onChange={(e) =>
                                                                    setExportFilters((prev) => ({
                                                                        ...prev,
                                                                        dateTo: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            <p className="text-xs text-neutral-500">
                                                The exported file can be opened in Excel or Google Sheets.
                                            </p>
                                        </div>
                                        <ModalFooter>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={closeExportModal}
                                                disabled={isExporting}
                                            >
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={isExporting}>
                                                {isExporting ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                        Exporting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Export
                                                    </>
                                                )}
                                            </Button>
                                        </ModalFooter>
                                    </form>
                                </ModalContent>
                            </Modal>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search pets, owners, or breeds..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
                                <SelectTrigger className="w-[140px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Species" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Species</SelectItem>
                                    <SelectItem value="dog">Dog</SelectItem>
                                    <SelectItem value="cat">Cat</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Pet Records Grid */}
            <Card className="border border-white/70 bg-white/95 shadow-lg dark:border-white/5 dark:bg-neutral-900">
                <CardContent className="p-6">
                    {/* Table Headers */}
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border-b border-neutral-300 dark:border-neutral-700 mb-4">
                        <div className="md:col-span-2">
                            <h3 className="font-semibold text-sm text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                                Pet Information
                            </h3>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                                Owner Details
                            </h3>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                                Last Visit
                            </h3>
                        </div>
                        <div className="md:col-span-2">
                            <h3 className="font-semibold text-sm text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                                Actions
                            </h3>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {paginatedPets.map((pet) => {
                            const overdueVaccinations = pet.vaccinations.filter(v => v.status === 'overdue' || v.status === 'due-soon').length;

                            return (
                                <div key={pet.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border border-neutral-200 rounded-lg dark:border-neutral-800 hover:shadow-md transition-shadow">
                                    <div className="md:col-span-2">
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                                <img
                                                    src={pet.imageUrl || '/placeholder.png'}
                                                    alt={pet.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.src = '/placeholder.png';
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                                    {pet.name}
                                                </p>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                    {pet.breed} • {pet.age} yr • {pet.gender}
                                                </p>
                                                <p className="text-xs text-neutral-400">
                                                    {pet.id} • {pet.weight}kg
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                                            {pet.owner.name}
                                        </p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Phone className="h-3 w-3 text-neutral-400" />
                                            <span className="text-xs text-neutral-500">
                                                {pet.owner.phone}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-1">
                                            <MapPin className="h-3 w-3 text-neutral-400" />
                                            <span className="text-xs text-neutral-500 truncate">
                                                {pet.owner.city || pet.owner.address}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium">
                                            {formatDate(pet.lastVisit)}
                                        </p>
                                    </div>

                                    <div className="md:col-span-2 flex items-center gap-2 flex-nowrap">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="whitespace-nowrap text-white"
                                            style={{ backgroundColor: themeColor, borderColor: themeColor }}
                                            onClick={() => router.get(`/pet-records/${pet.id}/manage`)}
                                        >
                                            <FileText className="h-4 w-4 mr-1" />
                                            Manage
                                        </Button>
                                        {pet.qrUrl && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                title="QR Code"
                                                onClick={() => setQrCardPet({
                                                    petId: pet.id,
                                                    name: pet.name,
                                                    species: pet.species,
                                                    breed: pet.breed,
                                                    qrUrl: pet.qrUrl!,
                                                })}
                                            >
                                                <QrCode className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Modal open={deletingPet?.id === pet.id} onOpenChange={(open) => !open && setDeletingPet(null)}>
                                            <ModalTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30 dark:border-red-800"
                                                    onClick={() => setDeletingPet(pet)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </ModalTrigger>
                                            <ModalContent>
                                                <ModalHeader>
                                                    <ModalTitle>Delete Pet Record</ModalTitle>
                                                    <ModalDescription>
                                                        Are you sure you want to delete <strong>{pet.name}</strong>'s record? This will permanently remove all associated consultations, vaccinations, medications, and payment records. This action cannot be undone.
                                                    </ModalDescription>
                                                </ModalHeader>
                                                <ModalFooter>
                                                    <Button variant="outline" onClick={() => setDeletingPet(null)}>
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        disabled={isDeleting}
                                                        onClick={() => handleDeletePet(pet)}
                                                    >
                                                        {isDeleting ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                                Deleting...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Trash2 className="h-4 w-4 mr-1" />
                                                                Delete Record
                                                            </>
                                                        )}
                                                    </Button>
                                                </ModalFooter>
                                            </ModalContent>
                                        </Modal>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredPets.length === 0 && (
                            <div className="text-center py-8 text-neutral-500">
                                No pet records found matching your criteria.
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700 pt-4 mt-4">
                            <p className="text-sm text-neutral-500">
                                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredPets.length)} of {filteredPets.length} records
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(page => {
                                        if (totalPages <= 5) return true;
                                        if (page === 1 || page === totalPages) return true;
                                        return Math.abs(page - currentPage) <= 1;
                                    })
                                    .reduce<(number | string)[]>((acc, page, idx, arr) => {
                                        if (idx > 0 && page - (arr[idx - 1] as number) > 1) acc.push('...');
                                        acc.push(page);
                                        return acc;
                                    }, [])
                                    .map((page, idx) =>
                                        typeof page === 'string' ? (
                                            <span key={`ellipsis-${idx}`} className="px-2 text-neutral-400">…</span>
                                        ) : (
                                            <Button
                                                key={page}
                                                variant={currentPage === page ? 'default' : 'outline'}
                                                size="sm"
                                                className="min-w-[36px]"
                                                onClick={() => setCurrentPage(page)}
                                            >
                                                {page}
                                            </Button>
                                        )
                                    )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pet Detail Modal */}
            {selectedPet && (
                <Modal open={!!selectedPet} onOpenChange={() => setSelectedPet(null)}>
                    <ModalContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <ModalHeader>
                            <ModalTitle>
                                {selectedPet.name} - Medical Record
                            </ModalTitle>
                            <ModalDescription>
                                Comprehensive health record and medical history
                            </ModalDescription>
                        </ModalHeader>

                        <div className="grid gap-6 py-4">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <h4 className="font-semibold">Pet Information</h4>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="font-medium">Species:</span> {selectedPet.species}</p>
                                        <p><span className="font-medium">Breed:</span> {selectedPet.breed}</p>
                                        <p><span className="font-medium">Age:</span> {selectedPet.age} years</p>
                                        <p><span className="font-medium">Weight:</span> {selectedPet.weight}kg</p>
                                        <p><span className="font-medium">Color:</span> {selectedPet.color}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-semibold">Owner Information</h4>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="font-medium">Name:</span> {selectedPet.owner.name}</p>
                                        <p><span className="font-medium">Phone:</span> {selectedPet.owner.phone}</p>
                                        <p><span className="font-medium">Email:</span> {selectedPet.owner.email}</p>
                                        <p><span className="font-medium">Address:</span> {selectedPet.owner.address}</p>
                                        {selectedPet.owner.city && (
                                            <p className="text-xs text-neutral-500">
                                                {[selectedPet.owner.street, selectedPet.owner.barangay, selectedPet.owner.city, selectedPet.owner.province, selectedPet.owner.zipCode].filter(Boolean).join(', ')}
                                            </p>
                                        )}
                                        <p><span className="font-medium">Emergency:</span> {selectedPet.owner.emergencyContact}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Vaccinations */}
                            <div>
                                <h4 className="font-semibold mb-3">Vaccination Status</h4>
                                <div className="grid gap-2">
                                    {selectedPet.vaccinations.map((vax, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                                            <div>
                                                <span className="font-medium">{vax.vaccine}</span>
                                                <span className="text-sm text-neutral-500 ml-2">
                                                    {vax.lastDate ? `Last: ${formatDate(vax.lastDate)}` : 'Not administered'}
                                                </span>
                                                {vax.clinicLocation && (
                                                    <p className="text-xs text-neutral-500">Clinic: {vax.clinicLocation}</p>
                                                )}
                                            </div>
                                            <Badge variant="outline" className={getVaccinationStatusColor(vax.status)}>
                                                {getStatusIcon(vax.status)}
                                                <span className="ml-1 capitalize">{vax.status.replace('-', ' ')}</span>
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Current Medications */}
                            {selectedPet.currentMedications.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-3">Current Medications</h4>
                                    <div className="space-y-2">
                                        {selectedPet.currentMedications.map((med, index) => (
                                            <div key={index} className="p-3 border rounded">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium flex items-center gap-2">
                                                            <Pill className="h-4 w-4 text-blue-500" />
                                                            {med.name}
                                                        </p>
                                                        <p className="text-sm text-neutral-600">{med.dosage}</p>
                                                        <p className="text-sm text-neutral-500">{med.purpose}</p>
                                                    </div>
                                                    <span className="text-xs bg-neutral-100 px-2 py-1 rounded">
                                                        {med.duration}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Allergies */}
                            {selectedPet.allergies.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-3">Known Allergies</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedPet.allergies.map((allergy, index) => (
                                            <Badge key={index} variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                                                {allergy}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <ModalFooter>
                            <Button variant="outline" onClick={() => setSelectedPet(null)}>
                                Close
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            {/* Toast Container */}

            {/* QR Card Modal */}
            {qrCardPet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-sm mx-4">
                        {/* Close button */}
                        <button
                            onClick={() => setQrCardPet(null)}
                            className="absolute -top-3 -right-3 z-10 rounded-full bg-white shadow-lg p-1.5 text-gray-500 hover:text-gray-800 transition"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Card */}
                        <div id="qr-card" className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                            {/* Clinic header */}
                            <div className="flex flex-col items-center gap-2 px-6 pt-6 pb-4" style={{ backgroundColor: themeColor }}>
                                {clinicLogo ? (
                                    <img src={`/storage/${clinicLogo}`} alt={clinicName} className="h-12 object-contain" />
                                ) : (
                                    <span className="text-2xl font-bold text-white tracking-wide">{clinicName}</span>
                                )}
                                <p className="text-slate-400 text-xs tracking-widest uppercase">Veterinary Clinic</p>
                            </div>

                            {/* QR Code */}
                            <div className="flex justify-center py-5 bg-white">
                                <canvas ref={qrCanvasRef} className="rounded-lg" />
                            </div>

                            {/* Pet details */}
                            <div className="px-6 pb-6 text-center space-y-1">
                                <p className="text-xl font-bold text-slate-900">{qrCardPet.name}</p>
                                <p className="text-sm text-slate-500">{qrCardPet.species} · {qrCardPet.breed}</p>
                                <p className="text-xs text-slate-400 font-mono mt-1">{qrCardPet.petId}</p>
                                <p className="text-xs text-slate-400 mt-2">Scan to view pet profile & visit history</p>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3 mt-4">
                            <Button
                                variant="outline"
                                className="flex-1 bg-white"
                                onClick={() => setQrCardPet(null)}
                            >
                                Close
                            </Button>
                            <Button
                                className="flex-1 gap-2"
                                style={{ backgroundColor: themeColor, borderColor: themeColor }}
                                onClick={downloadQrCard}
                            >
                                <Download className="h-4 w-4" />
                                Download QR
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 gap-2 bg-white"
                                onClick={() => {
                                    const previewUrl = resolveQrPreviewUrl(qrCardPet.qrUrl);
                                    if (previewUrl) window.open(previewUrl, '_blank');
                                }}
                            >
                                <QrCode className="h-4 w-4" />
                                Preview
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
