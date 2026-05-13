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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useToast } from '@/hooks/use-toast';
import {
    ArrowLeft,
    Search,
    Globe,
    Lock,
} from 'lucide-react';
import { useState } from 'react';

interface Pet {
    id: string;
    numericId: number;
    name: string;
    species: string;
    speciesIcon: string;
    owner: {
        name: string;
        phone: string;
    };
    historyVisibility: 'public' | 'private';
    registrationDate: string;
}

interface PaginatedResponse {
    data: Pet[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from: number;
    to: number;
}

interface Props {
    pets: PaginatedResponse;
    search: string;
    visibility: string;
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export default function PetVisibilitySettings({ pets, search: initialSearch, visibility: initialVisibility }: Props) {
    const { auth } = usePage<SharedData>().props;
    const themeColor = (auth.user as { theme_color?: string })?.theme_color || '#0f172a';
    const { success, error } = useToast();
    const [search, setSearch] = useState(initialSearch);
    const [visibility, setVisibility] = useState(initialVisibility || 'all');
    const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'History Visibility',
            href: '/pet-records/visibility',
        },
    ];

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/pet-records/visibility', {
            search: value,
            visibility: visibility === 'all' ? '' : visibility,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleVisibilityFilter = (value: string) => {
        setVisibility(value);
        router.get('/pet-records/visibility', {
            search: search,
            visibility: value === 'all' ? '' : value,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleToggleVisibility = async (petId: number, currentVisibility: 'public' | 'private') => {
        const newVisibility = currentVisibility === 'public' ? 'private' : 'public';

        setUpdatingIds(prev => new Set(prev).add(petId));

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

            const response = await fetch(`/pet-records/PET-${String(petId).padStart(3, '0')}/visibility`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ history_visibility: newVisibility }),
            });

            if (!response.ok) {
                throw new Error('Failed to update visibility');
            }

            success(`History visibility updated to ${newVisibility}!`);
            router.reload({ only: ['pets'] });
        } catch (err) {
            error('Failed to update visibility setting');
        } finally {
            setUpdatingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(petId);
                return newSet;
            });
        }
    };

    const handleClearFilters = () => {
        setSearch('');
        setVisibility('all');
        router.get('/pet-records/visibility', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePageChange = (page: number) => {
        router.get('/pet-records/visibility', {
            search: search,
            visibility: visibility === 'all' ? '' : visibility,
            page: page,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Pet History Visibility Settings" />

            <div className="space-y-6">
                {/* Filters Card */}
                <Card className="border border-white/70 bg-white/95 shadow-lg dark:border-white/5 dark:bg-neutral-900">
                    <CardHeader>
                        <CardTitle className="text-lg">Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Search by Pet or Owner</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                    <Input
                                        placeholder="Search pet name or owner..."
                                        value={search}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Filter by Visibility</label>
                                <Select value={visibility} onValueChange={handleVisibilityFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All visibilities" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All visibilities</SelectItem>
                                        <SelectItem value="public">Public</SelectItem>
                                        <SelectItem value="private">Private</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {(search || visibility) && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearFilters}
                            >
                                Clear Filters
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Results Card */}
                <Card className="border border-white/70 bg-white/95 shadow-lg dark:border-white/5 dark:bg-neutral-900">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Pet Records</CardTitle>
                                <CardDescription>
                                    {pets.total} total • {pets.from}-{pets.to} shown
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Pet ID</TableHead>
                                    <TableHead>Pet Name</TableHead>
                                    <TableHead>Species</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Registered</TableHead>
                                    <TableHead>Current Visibility</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pets.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-neutral-500">
                                            No pet records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    pets.data.map((pet) => {
                                        const isUpdating = updatingIds.has(pet.numericId);
                                        const newVisibility = pet.historyVisibility === 'public' ? 'private' : 'public';

                                        return (
                                            <TableRow key={pet.id}>
                                                <TableCell className="font-mono text-sm">{pet.id}</TableCell>
                                                <TableCell className="font-medium">{pet.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{pet.speciesIcon}</span>
                                                        <span>{pet.species}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <p className="font-medium">{pet.owner.name}</p>
                                                        <p className="text-xs text-neutral-500">{pet.owner.phone}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-neutral-600 dark:text-neutral-400">
                                                    {formatDate(pet.registrationDate)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={`flex w-fit items-center gap-1.5 ${
                                                            pet.historyVisibility === 'public'
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300'
                                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                                                        }`}
                                                    >
                                                        {pet.historyVisibility === 'public' ? (
                                                            <Globe className="h-3 w-3" />
                                                        ) : (
                                                            <Lock className="h-3 w-3" />
                                                        )}
                                                        <span className="capitalize">{pet.historyVisibility}</span>
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleToggleVisibility(pet.numericId, pet.historyVisibility)}
                                                        disabled={isUpdating}
                                                        className="w-32"
                                                    >
                                                        {isUpdating ? (
                                                            <span className="flex items-center gap-2">
                                                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                                Updating...
                                                            </span>
                                                        ) : (
                                                            `Set ${newVisibility}`
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {pets.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => handlePageChange(pets.current_page - 1)}
                            disabled={pets.current_page === 1}
                        >
                            Previous
                        </Button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: pets.last_page }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={page === pets.current_page ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handlePageChange(page)}
                                    className="h-9 w-9 p-0"
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => handlePageChange(pets.current_page + 1)}
                            disabled={pets.current_page === pets.last_page}
                        >
                            Next
                        </Button>
                    </div>
                )}

                {/* Legend */}
                <Card className="border border-white/70 bg-white/95 shadow-lg dark:border-white/5 dark:bg-neutral-900">
                    <CardHeader>
                        <CardTitle className="text-lg">Visibility Legend</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:border-green-400/30 dark:bg-green-500/10">
                                <div className="flex items-start gap-3">
                                    <Globe className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-green-900 dark:text-green-100">Public</h4>
                                        <p className="text-sm text-green-800 dark:text-green-300 mt-1">
                                            All authorized clinics can view the complete consultation history for this pet.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-400/30 dark:bg-blue-500/10">
                                <div className="flex items-start gap-3">
                                    <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-blue-900 dark:text-blue-100">Private</h4>
                                        <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                                            Only the clinic that originally created each consultation record can view it. Other clinics cannot access the history.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
