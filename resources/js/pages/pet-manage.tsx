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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useToast } from '@/hooks/use-toast';
import {
    ArrowLeft,
    Edit,
    Save,
    Plus,
    Calendar,
    Syringe,
    Pill,
    Heart,
    Activity,
    Phone,
    Mail,
    MapPin,
    User,
    PawPrint,
    FileText,
    AlertTriangle,
    CheckCircle,
    Clock,
    CreditCard,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';

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
    microchipId: string;
    imageUrl: string | null;
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
    consultationOptions: Array<{
        id: number;
        label: string;
        type: string;
        date: string;
    }>;
}

interface InventoryItemOption {
    id: number;
    code: string;
    name: string;
    brand: string;
    category: string;
    categorySlug: string;
    currentStock: number;
    unitPrice: number;
}

interface InventoryLine {
    inventory_item_id: number;
    quantity: number;
}

interface Props {
    pet: Pet;
    inventoryItems: InventoryItemOption[];
    vaccineItems: InventoryItemOption[];
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
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
            return <AlertTriangle className="h-4 w-4" />;
        default:
            return <Activity className="h-4 w-4" />;
    }
};

export default function PetManage({ pet, inventoryItems, vaccineItems }: Props) {
    const { auth } = usePage<SharedData>().props;
    const themeColor = (auth.user as { theme_color?: string })?.theme_color || '#0f172a';
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isAddConsultationOpen, setIsAddConsultationOpen] = useState(false);
    const [isAddVaccinationOpen, setIsAddVaccinationOpen] = useState(false);
    const [isEditVaccinationOpen, setIsEditVaccinationOpen] = useState(false);
    const [editingVaccination, setEditingVaccination] = useState<any>(null);
    const [consultationErrors, setConsultationErrors] = useState<Record<string, string>>({});
    const [selectedConsultation, setSelectedConsultation] = useState<any>(null);
    const [consultationInventory, setConsultationInventory] = useState<InventoryLine[]>([]);
    const [vaccinationInventory, setVaccinationInventory] = useState<InventoryLine[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inventorySelections, setInventorySelections] = useState({
        consultation: { itemId: '', quantity: 1 },
        vaccination: { itemId: '', quantity: 1 },
    });
    const { success, error } = useToast();

    const inventoryMap = useMemo(() => {
        const map = new Map<number, InventoryItemOption>();
        inventoryItems.forEach((item) => map.set(item.id, item));
        return map;
    }, [inventoryItems]);



    const { data, setData, post, processing, errors, reset } = useForm({
        // Pet profile data
        name: pet.name,
        breed: pet.breed,
        age: pet.age.toString(),
        weight: pet.weight.toString(),
        color: pet.color,
        microchipId: pet.microchipId || '',
        // Consultation data
        consultationType: '',
        consultationFee: '',
        chiefComplaint: '',
        diagnosis: '',
        treatment: '',
        notes: '',
        consultationDate: '',
        consultationFiles: [] as File[],
        // Vaccination data
        vaccinationConsultationId: '',
        vaccineName: '',
        vaccineType: '',
        vaccinationDate: '',
        nextDueDate: '',
        administeredBy: '',
        batchNumber: '',
        manufacturer: '',
        clinicLocation: '',
        vaccinationCost: '',
        vaccinationNotes: '',
        vaccinationReactions: '',
    });

    const consultationTypes = [
        { id: 'routine-checkup', name: 'General Check-up', price: 300, description: 'Regular visit' },
        { id: 'emergency', name: 'Emergency', price: 800, description: 'Urgent care' },
        { id: 'follow-up', name: 'Follow-up', price: 150, description: 'Review visit' },
        { id: 'surgery', name: 'Surgery Evaluation', price: 500, description: 'Pre-op consult' },
    ];

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Pet Records',
            href: '/pet-records',
        },
        {
            title: pet.name,
            href: `/pet-records/${pet.id}/manage`,
        },
    ];

    const handleSaveProfile = () => {
        const payload = {
            name: data.name,
            breed: data.breed || null,
            age: data.age ? Number(data.age) : null,
            weight: data.weight ? Number(data.weight) : null,
            color: data.color || null,
            microchipId: data.microchipId || null,
        };

        router.put(`/pet-records/${pet.id}`, payload, {
            onSuccess: () => {
                success('Pet profile updated successfully!');
                setIsEditingProfile(false);
            },
            onError: () => {
                error('Failed to update pet profile. Please check your inputs.');
            },
        });
    };

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        handleSaveProfile();
    };

    const handleConsultationTypeChange = (value: string) => {
        const selectedType = consultationTypes.find(t => t.id === value);
        setData(data => ({
            ...data,
            consultationType: value,
            consultationFee: selectedType ? selectedType.price.toString() : ''
        }));
    };

    type InventorySelectionKey = 'consultation' | 'vaccination';

    const getInventoryState = (type: InventorySelectionKey) => {
        switch (type) {
            case 'consultation':
                return { value: consultationInventory, setter: setConsultationInventory };
            case 'vaccination':
            default:
                return { value: vaccinationInventory, setter: setVaccinationInventory };
        }
    };

    const handleAddInventoryLine = (type: InventorySelectionKey) => {
        const selection = inventorySelections[type];
        if (!selection.itemId) {
            error('Select an inventory item to link');
            return;
        }

        const quantity = Math.max(1, Number(selection.quantity) || 1);
        const { value, setter } = getInventoryState(type);
        setter([ ...value, { inventory_item_id: Number(selection.itemId), quantity } ]);

        setInventorySelections((prev) => ({
            ...prev,
            [type]: { itemId: '', quantity: 1 },
        }));
    };

    const handleRemoveInventoryLine = (type: InventorySelectionKey, index: number) => {
        const { value, setter } = getInventoryState(type);
        setter(value.filter((_: InventoryLine, i: number) => i !== index));
    };

    const resetInventoryState = (type: InventorySelectionKey) => {
        const { setter } = getInventoryState(type);
        setter([]);
        setInventorySelections((prev) => ({
            ...prev,
            [type]: { itemId: '', quantity: 1 },
        }));
    };

    const renderInventorySection = (type: InventorySelectionKey, helperText: string) => {
        const selection = inventorySelections[type];
        const { value } = getInventoryState(type);
        const canAdd = selection.itemId !== '' && selection.quantity > 0;

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 border-b pb-2 flex-1">Medication Used</h4>
                </div>
                <p className="text-xs text-neutral-500">{helperText}</p>

                <div className="grid gap-3 items-end md:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Inventory Item</label>
                        <Select
                            value={selection.itemId}
                            onValueChange={(value) =>
                                setInventorySelections((prev) => ({
                                    ...prev,
                                    [type]: { ...prev[type], itemId: value },
                                }))
                            }
                            disabled={inventoryItems.length === 0}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={inventoryItems.length ? 'Select inventory item' : 'No items available'} />
                            </SelectTrigger>
                            <SelectContent>
                                {inventoryItems.map((item) => (
                                    <SelectItem key={item.id} value={item.id.toString()}>
                                        {item.name} • {item.code}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end gap-2">
                        <div className="w-24 flex flex-col gap-2">
                            <label className="text-sm font-medium">Quantity</label>
                            <Input
                                type="number"
                                min="1"
                                value={selection.quantity}
                                onChange={(e) =>
                                    setInventorySelections((prev) => ({
                                        ...prev,
                                        [type]: { ...prev[type], quantity: Math.max(1, Number(e.target.value) || 1) },
                                    }))
                                }
                                disabled={inventoryItems.length === 0}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium invisible">Add</label>
                            <Button
                                type="button"
                                onClick={() => handleAddInventoryLine(type)}
                                disabled={!canAdd || inventoryItems.length === 0}
                            >
                                Add
                            </Button>
                        </div>
                    </div>
                </div>
                {value.length > 0 && (
                    <div className="border rounded-lg divide-y">
                        {value.map((line, index) => {
                            const meta = inventoryMap.get(line.inventory_item_id);
                            return (
                                <div key={`${line.inventory_item_id}-${index}`} className="flex flex-col md:flex-row md:items-center md:justify-between px-3 py-2 text-sm gap-2">
                                    <div>
                                        <p className="font-medium">
                                            {meta?.name ?? 'Inventory Item'}
                                            <span className="text-xs text-neutral-500 ml-2">{line.quantity} units</span>
                                        </p>
                                        <p className="text-xs text-neutral-500">
                                            {meta?.code ?? 'N/A'} • {meta?.category ?? 'Uncategorized'} • Stock: {meta?.currentStock ?? 0}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600"
                                        onClick={() => handleRemoveInventoryLine(type, index)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Remove
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const handleAddConsultation = (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);
        setConsultationErrors({});

        const newErrors: Record<string, string> = {};
        if (!data.consultationType) {
            newErrors.consultationType = 'Please select a consultation type';
        }
        if (!data.chiefComplaint) {
            newErrors.chiefComplaint = 'Please enter the chief complaint';
        }
        if (!data.consultationDate) {
            newErrors.consultationDate = 'Please select a consultation date';
        }

        if (Object.keys(newErrors).length > 0) {
            setConsultationErrors(newErrors);
            Object.values(newErrors).forEach((msg) => error(msg));
            const firstField = Object.keys(newErrors)[0];
            const fieldEl = document.querySelector(`[name="${firstField}"]`) as HTMLElement | null;
            if (fieldEl) {
                fieldEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                fieldEl.focus();
            }
            return;
        }

        const formData = new FormData();
        formData.append('consultation_type', data.consultationType);
        formData.append('chief_complaint', data.chiefComplaint);
        formData.append('diagnosis', data.diagnosis || '');
        formData.append('treatment', data.treatment || '');
        formData.append('notes', data.notes || '');
        formData.append('consultation_date', data.consultationDate);
        formData.append('consultation_fee', data.consultationFee || '0');

        data.consultationFiles.forEach((file, index) => {
            formData.append(`consultation_files[${index}]`, file);
        });

        consultationInventory.forEach((item, index) => {
            formData.append(`inventory_items[${index}][inventory_item_id]`, item.inventory_item_id.toString());
            formData.append(`inventory_items[${index}][quantity]`, item.quantity.toString());
        });

        router.post(`/pet-records/${pet.id}/consultations`, formData, {
            onStart: () => {
                setConsultationErrors({});
            },
            onSuccess: () => {
                success('Consultation record added successfully!');
                setConsultationErrors({});
                setIsAddConsultationOpen(false);
                reset();
                resetInventoryState('consultation');
            },
            onError: (errors: Record<string, any>) => {
                const normalizedErrors: Record<string, string> = Object.fromEntries(
                    Object.entries(errors).map(([key, value]) => {
                        let msg = '';
                        if (Array.isArray(value) && value.length > 0) {
                            msg = value[0];
                        } else if (typeof value === 'string') {
                            msg = value;
                        } else if (value && typeof value === 'object') {
                            const first = Object.values(value)[0];
                            msg = Array.isArray(first) ? first[0] : String(first);
                        } else {
                            msg = 'Invalid input.';
                        }
                        return [key === 'consultation_type' ? 'consultationType' : key === 'chief_complaint' ? 'chiefComplaint' : key === 'consultation_date' ? 'consultationDate' : key, msg];
                    })
                );

                setConsultationErrors(normalizedErrors);
                Object.values(normalizedErrors).forEach((msg) => error(msg));

                const firstField = Object.keys(normalizedErrors)[0];
                const fieldEl = document.querySelector(`[name="${firstField}"]`) as HTMLElement | null;
                if (fieldEl) {
                    fieldEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    fieldEl.focus();
                }

                if (Object.keys(normalizedErrors).length === 0) {
                    error('Failed to add consultation. Please try again.');
                }
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const handleAddVaccination = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.vaccineName) {
            error('Please provide the vaccine name');
            return;
        }

        if (!data.vaccinationDate) {
            error('Please select the vaccination date');
            return;
        }

        if (!data.nextDueDate) {
            error('Please select the next due date');
            return;
        }

        const consultationId = data.vaccinationConsultationId ? Number(data.vaccinationConsultationId) : null;
        const feeValue = data.vaccinationCost ? Number(data.vaccinationCost) : null;

        if (data.vaccinationCost && Number.isNaN(feeValue)) {
            error('Vaccination fee must be a valid number');
            return;
        }

        const payload = {
            consultation_id: consultationId,
            vaccine_name: data.vaccineName,
            vaccine_type: data.vaccineType || null,
            vaccination_date: data.vaccinationDate,
            next_due_date: data.nextDueDate,
            batch_number: data.batchNumber || null,
            manufacturer: data.manufacturer || null,
            administered_by: data.administeredBy || null,
            clinic_location: data.clinicLocation || null,
            vaccination_fee: feeValue,
            notes: data.vaccinationNotes || null,
            adverse_reactions: data.vaccinationReactions || null,
            inventory_items: vaccinationInventory.map((item) => ({ ...item })),
        };

        router.post(`/pet-records/${pet.id}/vaccinations`, payload, {
            onSuccess: () => {
                success('Vaccination record added successfully!');
                setIsAddVaccinationOpen(false);
                reset(
                    'vaccinationConsultationId',
                    'vaccineName',
                    'vaccineType',
                    'vaccinationDate',
                    'nextDueDate',
                    'batchNumber',
                    'manufacturer',
                    'clinicLocation',
                    'administeredBy',
                    'vaccinationCost',
                    'vaccinationNotes',
                    'vaccinationReactions'
                );
                resetInventoryState('vaccination');
            },
            onError: (submissionErrors: Record<string, string>) => {
                if (submissionErrors.consultation_id) {
                    error(submissionErrors.consultation_id);
                }
                if (submissionErrors.vaccine_name) {
                    error(submissionErrors.vaccine_name);
                }
                if (submissionErrors.vaccination_date) {
                    error(submissionErrors.vaccination_date);
                }
                if (submissionErrors.next_due_date) {
                    error(submissionErrors.next_due_date);
                }
                if (!Object.keys(submissionErrors).length) {
                    error('Failed to add vaccination. Please try again.');
                }
            },
        });
    };

    const openEditVaccination = (vaccination: any) => {
        setEditingVaccination(vaccination);
        setData({
            ...data,
            vaccineName: vaccination.vaccine || '',
            vaccinationDate: vaccination.lastDate ? new Date(vaccination.lastDate).toISOString().split('T')[0] : '',
            nextDueDate: vaccination.nextDue ? new Date(vaccination.nextDue).toISOString().split('T')[0] : '',
            administeredBy: vaccination.administeredBy || '',
            vaccinationNotes: vaccination.notes || '',
            vaccinationReactions: '',
        });
        setIsEditVaccinationOpen(true);
    };

    const handleEditVaccination = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingVaccination) return;

        if (!data.vaccineName) {
            error('Please provide the vaccine name');
            return;
        }

        if (!data.vaccinationDate) {
            error('Please select the vaccination date');
            return;
        }

        if (!data.nextDueDate) {
            error('Please select the next due date');
            return;
        }

        const payload = {
            vaccine_name: data.vaccineName,
            vaccination_date: data.vaccinationDate,
            next_due_date: data.nextDueDate,
            administered_by: data.administeredBy || null,
            notes: data.vaccinationNotes || null,
            adverse_reactions: data.vaccinationReactions || null,
        };

        router.put(`/pet-records/${pet.id}/vaccinations/${editingVaccination.id}`, payload, {
            onSuccess: () => {
                success('Vaccination record updated successfully!');
                setIsEditVaccinationOpen(false);
                setEditingVaccination(null);
                reset(
                    'vaccineName',
                    'vaccinationDate',
                    'nextDueDate',
                    'administeredBy',
                    'vaccinationNotes',
                    'vaccinationReactions'
                );
            },
            onError: () => {
                error('Failed to update vaccination. Please try again.');
            },
        });
    };

    return (
        <AdminLayout
            breadcrumbs={breadcrumbs}
            title={`${pet.name} - Pet Management`}
            description="Comprehensive pet health management and medical records."
        >
            <Head title={`${pet.name} - Pet Management`} />
            <div className="h-[calc(100vh-12rem)] flex flex-col overflow-hidden">

            {/* Back Button */}
            <div className="mb-4 shrink-0">
                <Button variant="outline" onClick={() => window.history.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Pet Records
                </Button>
            </div>

            {/* Pet Header Card */}
            <Card className="border border-white/70 bg-white/95 shadow-lg dark:border-white/5 dark:bg-neutral-900 mb-4 shrink-0">
                <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                            <img
                                src={pet.imageUrl || '/placeholder.png'}
                                alt={pet.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = '/placeholder.png';
                                }}
                            />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                                        {pet.name}
                                    </h1>
                                    <p className="text-lg text-neutral-600 dark:text-neutral-400">
                                        {pet.breed} • {pet.age} years old • {pet.gender}
                                    </p>
                                    <p className="text-sm text-neutral-500">
                                        ID: {pet.id} • Microchip: {pet.microchipId}
                                    </p>
                                </div>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                    <Activity className="h-3 w-3 mr-1" />
                                    {pet.status}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="h-4 w-4 text-neutral-400" />
                                        <span className="font-medium">Owner:</span>
                                        <span>{pet.owner.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-4 w-4 text-neutral-400" />
                                        <span>{pet.owner.phone}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-neutral-400" />
                                        <span className="font-medium">Last Visit:</span>
                                        <span>{formatDate(pet.lastVisit)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <PawPrint className="h-4 w-4 text-neutral-400" />
                                        <span className="font-medium">Weight:</span>
                                        <span>{pet.weight}kg</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Management Tabs */}
            <Tabs defaultValue="profile" className="space-y-4 flex-1 min-h-0 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-3 shrink-0">
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Pet Profile
                    </TabsTrigger>
                    <TabsTrigger value="consultations" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Consultations
                    </TabsTrigger>
                    <TabsTrigger value="vaccinations" className="flex items-center gap-2">
                        <Syringe className="h-4 w-4" />
                        Vaccinations
                    </TabsTrigger>
                </TabsList>

                {/* Pet Profile Tab */}
                <TabsContent value="profile" className="flex-1 min-h-0 mt-0">
                    <Card className="border border-white/70 bg-white/95 shadow-lg dark:border-white/5 dark:bg-neutral-900 h-full min-h-0 flex flex-col">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Pet Profile</CardTitle>
                                    <CardDescription>
                                        Basic information and details about {pet.name}
                                    </CardDescription>
                                </div>
                                <Button
                                    variant={isEditingProfile ? "default" : "outline"}
                                    onClick={isEditingProfile ? handleSaveProfile : () => setIsEditingProfile(true)}
                                >
                                    {isEditingProfile ? (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Changes
                                        </>
                                    ) : (
                                        <>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Profile
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto pr-2">
                            <form onSubmit={handleUpdateProfile}>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold">Basic Information</h4>
                                        <div className="grid gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Pet Name</label>
                                                <Input
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    disabled={!isEditingProfile}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Breed</label>
                                                <Input
                                                    value={data.breed}
                                                    onChange={(e) => setData('breed', e.target.value)}
                                                    disabled={!isEditingProfile}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Age (years)</label>
                                                    <Input
                                                        type="number"
                                                        value={data.age}
                                                        onChange={(e) => setData('age', e.target.value)}
                                                        disabled={!isEditingProfile}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Weight (kg)</label>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        value={data.weight}
                                                        onChange={(e) => setData('weight', e.target.value)}
                                                        disabled={!isEditingProfile}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Color/Markings</label>
                                                <Input
                                                    value={data.color}
                                                    onChange={(e) => setData('color', e.target.value)}
                                                    disabled={!isEditingProfile}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Microchip ID</label>
                                                <Input
                                                    value={data.microchipId}
                                                    onChange={(e) => setData('microchipId', e.target.value)}
                                                    disabled={!isEditingProfile}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="font-semibold">Owner Information</h4>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-neutral-400" />
                                                        <span className="font-medium">{pet.owner.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4 text-neutral-400" />
                                                        <span>{pet.owner.phone}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4 text-neutral-400" />
                                                        <span>{pet.owner.email || 'No email provided'}</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="h-4 w-4 text-neutral-400 mt-0.5" />
                                                        <div className="text-sm">
                                                            <span>{pet.owner.address}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {pet.allergies.length > 0 && (
                                            <div className="space-y-2">
                                                <h5 className="font-medium text-sm">Known Allergies</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {pet.allergies.map((allergy, index) => (
                                                        <Badge key={index} variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                                                            {allergy}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Consultations Tab */}
                <TabsContent value="consultations" className="flex-1 min-h-0 mt-0">
                    <Card className="border border-white/70 bg-white/95 shadow-lg dark:border-white/5 dark:bg-neutral-900 h-full min-h-0 flex flex-col">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Consultation Records</CardTitle>
                                    <CardDescription>
                                        Medical consultations and examination history
                                    </CardDescription>
                                </div>
                                <Modal open={isAddConsultationOpen} onOpenChange={setIsAddConsultationOpen}>
                                    <ModalTrigger asChild>
                                        <Button className="text-white" style={{ backgroundColor: themeColor, borderColor: themeColor }}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Consultation
                                        </Button>
                                    </ModalTrigger>
                                    <ModalContent className="max-w-4xl w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
                                        <ModalHeader className="flex-shrink-0 pb-4 border-b">
                                            <ModalTitle>New Consultation Record</ModalTitle>
                                            <ModalDescription>
                                                Record a new consultation for {pet.name}
                                            </ModalDescription>
                                        </ModalHeader>
                                        <div className="flex-1 overflow-y-auto">
                                            <form onSubmit={handleAddConsultation} className="p-6">
                                                {Object.keys(consultationErrors).length > 0 && (
                                                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700 mb-3">
                                                        {/* <p className="text-sm font-semibold">Please fix the following errors:</p>
                                                        <ul className="list-disc pl-5 mt-1 text-xs">
                                                            {Object.entries(consultationErrors).map(([field, message]) => (
                                                                <li key={field} className="truncate">{field}: {message}</li>
                                                            ))}
                                                        </ul> */}
                                                    </div>
                                                )}
                                                <div className="space-y-6">
                                                    {/* Basic Information */}
                                                    <div className="space-y-4">
                                                        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 border-b pb-2">Consultation Details</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <label className="text-sm font-medium">Consultation Type *</label>
                                                                <Select name="consultationType" value={data.consultationType} onValueChange={handleConsultationTypeChange} required>
                                                                    <SelectTrigger className={consultationErrors.consultationType ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}>
                                                                        <SelectValue placeholder="Select type" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {consultationTypes.map((type) => (
                                                                            <SelectItem key={type.id} value={type.id}>
                                                                                {type.name} - ₱{type.price}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-sm font-medium">Date *</label>
                                                                <Input
                                                                    name="consultationDate"
                                                                    type="date"
                                                                    value={data.consultationDate}
                                                                    onChange={(e) => setData('consultationDate', e.target.value)}
                                                                    className={consultationErrors.consultationDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                                                                    required
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                            {/* Medical Information */}
                                            <div className="space-y-4">
                                                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 border-b pb-2">Medical Information</h4>
                                                <div className="space-y-4">
                                                            <div className="space-y-2">
                                                                <label className="text-sm font-medium">Chief Complaint *</label>
                                                                <Textarea
                                                                    name="chiefComplaint"
                                                                    placeholder="Main reason for visit..."
                                                                    value={data.chiefComplaint}
                                                                    onChange={(e) => setData('chiefComplaint', e.target.value)}
                                                                    rows={3}
                                                                    required
                                                                    className={`resize-none ${consultationErrors.chiefComplaint ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                                                />
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <label className="text-sm font-medium">Diagnosis</label>
                                                                    <Textarea
                                                                        placeholder="Clinical findings and diagnosis..."
                                                                        value={data.diagnosis}
                                                                        onChange={(e) => setData('diagnosis', e.target.value)}
                                                                        rows={3}
                                                                        className="resize-none"
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="text-sm font-medium">Treatment</label>
                                                                    <Textarea
                                                                        placeholder="Treatment plan and medications prescribed..."
                                                                        value={data.treatment}
                                                                        onChange={(e) => setData('treatment', e.target.value)}
                                                                        rows={3}
                                                                        className="resize-none"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <label className="text-sm font-medium">Additional Notes</label>
                                                                <Textarea
                                                                    placeholder="Any additional observations or notes..."
                                                                    value={data.notes}
                                                                    onChange={(e) => setData('notes', e.target.value)}
                                                                    rows={2}
                                                                    className="resize-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {renderInventorySection('consultation', 'Include vaccines, medications, or consumables used during this consultation to keep stock levels accurate.')}

                                                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-semibold text-sm">Total Estimated Cost</span>
                                                            <span className="font-bold text-lg">
                                                                ₱{((parseFloat(data.consultationFee) || 0) + consultationInventory.reduce((sum, item) => {
                                                                    const meta = inventoryMap.get(item.inventory_item_id);
                                                                    return sum + (meta ? meta.unitPrice * item.quantity : 0);
                                                                }, 0)).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-neutral-500 mt-1">Includes consultation fee and selected inventory items.</p>
                                                    </div>

                                                    {/* File Upload Section */}
                                                    <div className="space-y-4">
                                                        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 border-b pb-2">File Attachments</h4>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Attach Files (Optional)</label>
                                                    <div className="text-xs text-gray-600 mb-2">
                                                        Upload X-rays, lab results, photos, or documents (Max 10MB per file)
                                                    </div>
                                                    <div className="relative">
                                                        <Input
                                                            type="file"
                                                            accept="image/*,application/pdf,.doc,.docx,.webp"
                                                            multiple
                                                            onChange={(e) => {
                                                                const newFiles = Array.from(e.target.files || []);
                                                                // Append new files to existing ones
                                                                setData('consultationFiles', [...data.consultationFiles, ...newFiles]);
                                                                // Clear the input so the same files can be selected again if needed
                                                                e.target.value = '';
                                                            }}
                                                            className="hidden"
                                                            id="consultationFiles"
                                                        />
                                                        <label
                                                            htmlFor="consultationFiles"
                                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-transparent hover:bg-gray-50/50 dark:hover:bg-gray-800/30 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
                                                        >
                                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                                <div className="text-center">
                                                                    <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400 mx-auto" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                                                    </svg>
                                                                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                                                        <span className="font-semibold">{data.consultationFiles.length > 0 ? 'Click to add more files' : 'Click to upload'}</span> or drag and drop
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                        Images (JPEG, PNG, GIF, WebP), PDFs, or Documents
                                                                    </p>
                                                                    {data.consultationFiles.length > 0 && (
                                                                        <p className="text-xs text-green-600 mt-1 font-medium">
                                                                            {data.consultationFiles.length} file(s) selected
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </label>
                                                    </div>

                                                    {/* File Preview */}
                                                    {data.consultationFiles.length > 0 && (
                                                        <div className="mt-3 space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-sm font-medium">Selected Files:</p>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setData('consultationFiles', [])}
                                                                    className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                                                                >
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                    Clear All
                                                                </button>
                                                            </div>
                                                            <div className="max-h-32 overflow-y-auto space-y-1">
                                                                {data.consultationFiles.map((file, index) => {
                                                                    const removeFile = () => {
                                                                        const updatedFiles = data.consultationFiles.filter((_, i) => i !== index);
                                                                        setData('consultationFiles', updatedFiles);
                                                                    };

                                                                    return (
                                                                        <div key={index} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded group">
                                                                            <div className="flex items-center gap-2 truncate flex-1">
                                                                                {file.type.startsWith('image/') ? (
                                                                                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                                    </svg>
                                                                                ) : (
                                                                                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                                    </svg>
                                                                                )}
                                                                                <span className="truncate font-medium">{file.name}</span>
                                                                                <span className="text-gray-500 ml-auto flex-shrink-0">
                                                                                    {(file.size / 1024 / 1024).toFixed(1)}MB
                                                                                </span>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={removeFile}
                                                                                className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                                                                title="Remove file"
                                                                            >
                                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                                </svg>
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                    </div>
                                                </div>
                                                </div>
                                                <ModalFooter className="flex-shrink-0 border-t p-4">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => {setIsAddConsultationOpen(false); reset();}}
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            type="submit"
                                                            disabled={processing}
                                                            className="text-white"
                                                            style={{ backgroundColor: themeColor, borderColor: themeColor }}
                                                        >
                                                            {processing ? 'Saving...' : 'Save Consultation'}
                                                        </Button>
                                                    </div>
                                                </ModalFooter>
                                            </form>
                                        </div>
                                    </ModalContent>
                                </Modal>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden">
                            <div className="h-full overflow-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Veterinarian</TableHead>
                                        <TableHead>Diagnosis</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pet.medicalHistory.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-neutral-500">
                                                No consultation records found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        pet.medicalHistory.map((record, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{formatDate(record.date)}</TableCell>
                                                <TableCell className="capitalize">{record.type.replace('-', ' ')}</TableCell>
                                                <TableCell>Dr. {record.veterinarian}</TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={record.diagnosis}>
                                                    {record.diagnosis || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn(
                                                        "capitalize",
                                                        record.paymentStatus === 'paid' ? "bg-green-50 text-green-700 border-green-200" :
                                                        record.paymentStatus === 'pending' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                                        "bg-neutral-50 text-neutral-700 border-neutral-200"
                                                    )}>
                                                        {record.paymentStatus}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => setSelectedConsultation(record)}>
                                                        View Details
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            </div>

                            {/* Consultation Details Modal */}
                            <Modal open={!!selectedConsultation} onOpenChange={(open) => !open && setSelectedConsultation(null)}>
                                <ModalContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                                    <ModalHeader>
                                        <ModalTitle>Consultation Details</ModalTitle>
                                        <ModalDescription>
                                            {selectedConsultation && `${formatDate(selectedConsultation.date)} • ${selectedConsultation.type.replace('-', ' ')}`}
                                        </ModalDescription>
                                    </ModalHeader>
                                    {selectedConsultation && (
                                        <div className="space-y-6 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-sm font-medium text-neutral-500">Veterinarian</span>
                                                    <p className="text-sm">{selectedConsultation.veterinarian}</p>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-neutral-500">Payment Status</span>
                                                    <div className="mt-1">
                                                        <Badge variant="outline" className={cn(
                                                            "capitalize",
                                                            selectedConsultation.paymentStatus === 'paid' ? "bg-green-50 text-green-700 border-green-200" :
                                                            selectedConsultation.paymentStatus === 'pending' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                                            "bg-neutral-50 text-neutral-700 border-neutral-200"
                                                        )}>
                                                            {selectedConsultation.paymentStatus}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="font-medium text-sm mb-1">Chief Complaint</h4>
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-md">
                                                        {selectedConsultation.complaint}
                                                    </p>
                                                </div>

                                                {selectedConsultation.diagnosis && (
                                                    <div>
                                                        <h4 className="font-medium text-sm mb-1">Diagnosis</h4>
                                                        <p className="text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-md">
                                                            {selectedConsultation.diagnosis}
                                                        </p>
                                                    </div>
                                                )}

                                                {selectedConsultation.treatment && (
                                                    <div>
                                                        <h4 className="font-medium text-sm mb-1">Treatment</h4>
                                                        <p className="text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-md">
                                                            {selectedConsultation.treatment}
                                                        </p>
                                                    </div>
                                                )}

                                                {selectedConsultation.notes && (
                                                    <div>
                                                        <h4 className="font-medium text-sm mb-1">Notes</h4>
                                                        <p className="text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-md">
                                                            {selectedConsultation.notes}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {(selectedConsultation.linkedVaccinations?.length > 0 || selectedConsultation.linkedMedications?.length > 0) && (
                                                <div className="border-t pt-4 space-y-4">
                                                    {selectedConsultation.linkedVaccinations?.length > 0 && (
                                                        <div>
                                                            <h4 className="font-medium text-sm mb-2">Vaccinations</h4>
                                                            <ul className="space-y-1">
                                                                {selectedConsultation.linkedVaccinations.map((item: any) => (
                                                                    <li key={item.id} className="text-sm flex items-center gap-2">
                                                                        <Syringe className="h-3 w-3 text-neutral-400" />
                                                                        <span>{item.vaccine}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {selectedConsultation.linkedMedications?.length > 0 && (
                                                        <div>
                                                            <h4 className="font-medium text-sm mb-2">Medications</h4>
                                                            <ul className="space-y-1">
                                                                {selectedConsultation.linkedMedications.map((item: any) => (
                                                                    <li key={item.id} className="text-sm flex items-center gap-2">
                                                                        <Pill className="h-3 w-3 text-neutral-400" />
                                                                        <span>{item.name}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {selectedConsultation.files?.length > 0 && (
                                                <div className="border-t pt-4">
                                                    <h4 className="font-medium text-sm mb-2">Attachments ({selectedConsultation.files.length})</h4>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {selectedConsultation.files.map((file: any, index: number) => (
                                                            <a
                                                                key={index}
                                                                href={file.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
                                                            >
                                                                <FileText className="w-4 h-4 text-blue-600" />
                                                                <span className="text-xs font-medium truncate flex-1">{file.name}</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <ModalFooter>
                                        <Button onClick={() => setSelectedConsultation(null)}>Close</Button>
                                    </ModalFooter>
                                </ModalContent>
                            </Modal>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Vaccinations Tab */}
                <TabsContent value="vaccinations" className="flex-1 min-h-0 mt-0">
                    <Card className="border border-white/70 bg-white/95 shadow-lg dark:border-white/5 dark:bg-neutral-900 h-full min-h-0 flex flex-col">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Vaccination Records</CardTitle>
                                    <CardDescription>
                                        Complete vaccination history and schedule
                                    </CardDescription>
                                </div>
                                <Modal open={isAddVaccinationOpen} onOpenChange={setIsAddVaccinationOpen}>
                                    <ModalTrigger asChild>
                                        <Button className="text-white" style={{ backgroundColor: themeColor, borderColor: themeColor }}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Vaccination
                                        </Button>
                                    </ModalTrigger>
                                    <ModalContent className="max-w-lg max-h-[90vh] flex flex-col">
                                        <ModalHeader>
                                            <ModalTitle>New Vaccination Record</ModalTitle>
                                            <ModalDescription>
                                                Record a vaccination for {pet.name}
                                            </ModalDescription>
                                        </ModalHeader>
                                        <form onSubmit={handleAddVaccination} className="flex flex-col flex-1 overflow-hidden">
                                            <div className="flex-1 overflow-y-auto px-1 space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Link To Consultation (optional)</label>
                                                    <Select
                                                        value={data.vaccinationConsultationId || 'none'}
                                                        onValueChange={(value) => setData('vaccinationConsultationId', value === 'none' ? '' : value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select consultation" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">No consultation link</SelectItem>
                                                            {pet.consultationOptions.map((option) => (
                                                                <SelectItem key={option.id} value={option.id.toString()}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Vaccine *</label>
                                                    <Select
                                                        value={data.vaccineName}
                                                        onValueChange={(value) => {
                                                            setData('vaccineName', value);
                                                            const selectedVaccine = vaccineItems.find(item => item.name === value);
                                                            if (selectedVaccine) {
                                                                setData('vaccinationCost', selectedVaccine.unitPrice?.toString() || '');
                                                                // Automatically include the selected vaccine in the inventory items list
                                                                setVaccinationInventory((prev) => {
                                                                    const existing = prev.find(item => item.inventory_item_id === selectedVaccine.id);
                                                                    if (existing) {
                                                                        return prev.map((item) =>
                                                                            item.inventory_item_id === selectedVaccine.id
                                                                                ? { ...item, quantity: item.quantity + 1 }
                                                                                : item
                                                                        );
                                                                    }
                                                                    return [...prev, { inventory_item_id: selectedVaccine.id, quantity: 1 }];
                                                                });
                                                            }
                                                        }}
                                                        required
                                                        disabled={vaccineItems.length === 0}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={vaccineItems.length === 0 ? "No vaccines in inventory" : "Select vaccine from inventory"} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {vaccineItems.map((item) => (
                                                                <SelectItem key={item.id} value={item.name}>
                                                                    {item.name} {item.brand && `(${item.brand})`} - Stock: {item.currentStock}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Vaccination Date *</label>
                                                        <Input
                                                            type="date"
                                                            value={data.vaccinationDate}
                                                            onChange={(e) => setData('vaccinationDate', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Next Due Date *</label>
                                                        <Input
                                                            type="date"
                                                            value={data.nextDueDate}
                                                            onChange={(e) => setData('nextDueDate', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Notes</label>
                                                    <Textarea
                                                        placeholder="Additional notes"
                                                        value={data.vaccinationNotes}
                                                        onChange={(e) => setData('vaccinationNotes', e.target.value)}
                                                        rows={2}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Adverse Reactions</label>
                                                    <Textarea
                                                        placeholder="Document any observed reactions"
                                                        value={data.vaccinationReactions}
                                                        onChange={(e) => setData('vaccinationReactions', e.target.value)}
                                                        rows={2}
                                                    />
                                                </div>
                                                {/* Total Cost */}
                                                <div className="border-t pt-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium">Total Cost</span>
                                                        <span className="text-lg font-bold text-primary">
                                                            ₱{(vaccineItems.find(item => item.name === data.vaccineName)?.unitPrice ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <ModalFooter>
                                                <Button type="button" variant="outline" onClick={() => setIsAddVaccinationOpen(false)}>
                                                    Cancel
                                                </Button>
                                                <Button type="submit" disabled={processing} className="text-white" style={{ backgroundColor: themeColor, borderColor: themeColor }}>
                                                    {processing ? 'Saving...' : 'Save Vaccination'}
                                                </Button>
                                            </ModalFooter>
                                        </form>
                                    </ModalContent>
                                </Modal>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden">
                            <div className="h-full overflow-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Vaccine</TableHead>
                                        <TableHead>Last Administered</TableHead>
                                        <TableHead>Next Due</TableHead>
                                        <TableHead>Administered By</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pet.vaccinations.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                No vaccination records found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        pet.vaccinations.map((vaccination, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Syringe className="h-4 w-4 text-neutral-400" />
                                                        <span className="font-medium">{vaccination.vaccine}</span>
                                                    </div>
                                                    {vaccination.consultation && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Linked: {formatDate(vaccination.consultation.date)}
                                                        </p>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {vaccination.lastDate ? formatDate(vaccination.lastDate) : <span className="text-muted-foreground">-</span>}
                                                </TableCell>
                                                <TableCell>{formatDate(vaccination.nextDue)}</TableCell>
                                                <TableCell>
                                                    {vaccination.administeredBy || <span className="text-muted-foreground">-</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={vaccination.paymentStatus === 'paid'
                                                        ? 'border-transparent bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                                                        : 'border-transparent bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200'
                                                    }>
                                                        {vaccination.paymentStatus === 'paid' ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                                        <span className="ml-1 capitalize">{vaccination.paymentStatus}</span>
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEditVaccination(vaccination)}
                                                    >
                                                        <Edit className="h-4 w-4 mr-1" />
                                                        Edit
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Edit Vaccination Modal */}
                    <Modal open={isEditVaccinationOpen} onOpenChange={setIsEditVaccinationOpen}>
                        <ModalContent className="max-w-lg max-h-[90vh] flex flex-col">
                            <ModalHeader>
                                <ModalTitle>Edit Vaccination Record</ModalTitle>
                                <ModalDescription>
                                    Update vaccination details for {pet.name}
                                </ModalDescription>
                            </ModalHeader>
                            <form onSubmit={handleEditVaccination} className="flex flex-col flex-1 overflow-hidden">
                                <div className="flex-1 overflow-y-auto px-1 space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Vaccine *</label>
                                        <Select
                                            value={data.vaccineName}
                                            onValueChange={(value) => setData('vaccineName', value)}
                                            required
                                            disabled={vaccineItems.length === 0}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={vaccineItems.length === 0 ? "No vaccines in inventory" : "Select vaccine from inventory"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {vaccineItems.map((item) => (
                                                    <SelectItem key={item.id} value={item.name}>
                                                        {item.name} {item.brand && `(${item.brand})`} - Stock: {item.currentStock}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Vaccination Date *</label>
                                            <Input
                                                type="date"
                                                value={data.vaccinationDate}
                                                onChange={(e) => setData('vaccinationDate', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Next Due Date *</label>
                                            <Input
                                                type="date"
                                                value={data.nextDueDate}
                                                onChange={(e) => setData('nextDueDate', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Administered By</label>
                                        <Input
                                            placeholder="Veterinarian name"
                                            value={data.administeredBy}
                                            onChange={(e) => setData('administeredBy', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Notes</label>
                                        <Textarea
                                            placeholder="Additional notes"
                                            value={data.vaccinationNotes}
                                            onChange={(e) => setData('vaccinationNotes', e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Adverse Reactions</label>
                                        <Textarea
                                            placeholder="Document any observed reactions"
                                            value={data.vaccinationReactions}
                                            onChange={(e) => setData('vaccinationReactions', e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                </div>
                                <ModalFooter>
                                    <Button type="button" variant="outline" onClick={() => {
                                        setIsEditVaccinationOpen(false);
                                        setEditingVaccination(null);
                                    }}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={processing} className="text-white" style={{ backgroundColor: themeColor, borderColor: themeColor }}>
                                        {processing ? 'Saving...' : 'Update Vaccination'}
                                    </Button>
                                </ModalFooter>
                            </form>
                        </ModalContent>
                    </Modal>
                </TabsContent>
            </Tabs>
            </div>

            {/* Toast Container */}
        </AdminLayout>
    );
}
