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
    Modal,
    ModalContent,
    ModalDescription,
    ModalFooter,
    ModalHeader,
    ModalTitle,
} from '@/components/ui/modal';
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
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { ownerManagement } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Edit,
    PawPrint,
    Search,
    ShieldAlert,
    Trash2,
    UserCheck,
    UserX,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface OwnerUser {
    id: number;
    name: string;
    email: string;
    status: 'active' | 'inactive' | 'suspended';
    petsCount: number;
    lastLogin: string | null;
    createdAt: string;
}

interface Stats {
    total: number;
    active: number;
    linked: number;
}

interface Props {
    owners: OwnerUser[];
    stats: Stats;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Owner Management', href: ownerManagement.url() },
];

const perPage = 10;

export default function OwnerManagement({ owners, stats }: Props) {
    const { success, error } = useToast();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingOwner, setEditingOwner] = useState<OwnerUser | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingOwner, setDeletingOwner] = useState<OwnerUser | null>(null);

    const { data, setData, put, processing, reset, errors } = useForm({
        name: '',
        email: '',
        status: 'active' as 'active' | 'inactive' | 'suspended',
    });

    const filtered = useMemo(() => {
        return owners.filter((o) => {
            const matchSearch =
                o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchStatus = selectedStatus === 'all' || o.status === selectedStatus;
            return matchSearch && matchStatus;
        });
    }, [owners, searchTerm, selectedStatus]);

    const totalPages = Math.ceil(filtered.length / perPage);
    const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'border-transparent bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200';
            case 'suspended':
                return 'border-transparent bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200';
            default:
                return 'border-transparent bg-gray-50 text-gray-700 dark:border-gray-400/30 dark:bg-gray-500/10 dark:text-gray-200';
        }
    };

    const formatDate = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatLastLogin = (d: string | null) => {
        if (!d) return 'Never';
        const diff = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
        if (diff < 24) return `${diff}h ago`;
        if (diff < 168) return `${Math.floor(diff / 24)}d ago`;
        return formatDate(d);
    };

    const openEdit = (owner: OwnerUser) => {
        setEditingOwner(owner);
        setData({ name: owner.name, email: owner.email, status: owner.status });
        setIsEditModalOpen(true);
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOwner) return;
        put(`/owner-management/${editingOwner.id}`, {
            onSuccess: () => {
                success('Owner account updated!');
                setIsEditModalOpen(false);
                setEditingOwner(null);
                reset();
            },
            onError: (err) => {
                if (err.email) error(err.email);
            },
        });
    };

    const handleToggleStatus = (owner: OwnerUser) => {
        router.patch(`/owner-management/${owner.id}/toggle-status`, {}, {
            onSuccess: () => success('Owner status updated!'),
        });
    };

    const openDelete = (owner: OwnerUser) => {
        setDeletingOwner(owner);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (!deletingOwner) return;
        router.delete(`/owner-management/${deletingOwner.id}`, {
            onSuccess: () => {
                success('Owner account deleted!');
                setIsDeleteModalOpen(false);
                setDeletingOwner(null);
            },
            onError: () => error('Failed to delete owner account.'),
        });
    };

    return (
        <AdminLayout
            breadcrumbs={breadcrumbs}
            title="Owner Management"
            description="Manage pet owner accounts and their portal access."
        >
            <Head title="Owner Management" />

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Owners</CardTitle>
                        <Users className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Registered owner accounts</p>
                    </CardContent>
                </Card>
                <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active</CardTitle>
                        <UserCheck className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
                        <p className="text-xs text-muted-foreground">Active owner accounts</p>
                    </CardContent>
                </Card>
                <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Linked to Clinic Records</CardTitle>
                        <PawPrint className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.linked}</div>
                        <p className="text-xs text-muted-foreground">Owners matched to clinic pets</p>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Pet Owner Accounts</CardTitle>
                            <CardDescription>Self-registered owners who access the owner portal.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center mb-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-8"
                            />
                        </div>
                        <Select value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v); setCurrentPage(1); }}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Owner</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Pets</TableHead>
                                <TableHead>Last Login</TableHead>
                                <TableHead>Registered</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginated.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                        No owner accounts found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginated.map((owner) => (
                                    <TableRow key={owner.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-semibold text-white">
                                                    {owner.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                                                </div>
                                                <span className="font-medium">{owner.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{owner.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn('text-xs', getStatusColor(owner.status))}>
                                                {owner.status.charAt(0).toUpperCase() + owner.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="flex items-center gap-1 text-sm">
                                                <PawPrint className="h-3.5 w-3.5 text-muted-foreground" />
                                                {owner.petsCount}
                                            </span>
                                        </TableCell>
                                        <TableCell>{formatLastLogin(owner.lastLogin)}</TableCell>
                                        <TableCell>{formatDate(owner.createdAt)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => openEdit(owner)}>
                                                    <Edit className="mr-1 h-4 w-4" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={owner.status === 'active' ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}
                                                    onClick={() => handleToggleStatus(owner)}
                                                >
                                                    {owner.status === 'active' ? (
                                                        <><UserX className="mr-1 h-4 w-4" />Suspend</>
                                                    ) : (
                                                        <><UserCheck className="mr-1 h-4 w-4" />Activate</>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700"
                                                    onClick={() => openDelete(owner)}
                                                >
                                                    <Trash2 className="mr-1 h-4 w-4" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Showing {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} of {filtered.length}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm">Page {currentPage} of {totalPages}</span>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Modal */}
            <Modal open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <ModalContent className="max-w-md">
                    <form onSubmit={handleEdit}>
                        <ModalHeader>
                            <ModalTitle>Edit Owner Account</ModalTitle>
                            <ModalDescription>Update the owner's account details.</ModalDescription>
                        </ModalHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name *</label>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email *</label>
                                <Input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                                <p className="text-xs text-slate-500">Changing the email will re-link this account to clinic owner records with the new email.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status *</label>
                                <Select value={data.status} onValueChange={(v) => setData('status', v as typeof data.status)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <ModalFooter>
                            <Button type="button" variant="outline" onClick={() => { setIsEditModalOpen(false); reset(); }}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>

            {/* Delete Confirm Modal */}
            <Modal open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <ModalContent className="max-w-md">
                    <ModalHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                                <ShieldAlert className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <ModalTitle>Delete Owner Account</ModalTitle>
                                <ModalDescription>This action cannot be undone.</ModalDescription>
                            </div>
                        </div>
                    </ModalHeader>
                    <div className="px-6 py-2 text-sm text-slate-600">
                        Are you sure you want to delete <strong>{deletingOwner?.name}</strong>'s account? Their clinic pet records will be preserved but the portal access will be removed.
                    </div>
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete Account
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </AdminLayout>
    );
}
