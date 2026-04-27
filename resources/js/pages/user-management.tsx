import InputError from '@/components/input-error';
import { PasswordMatchIndicator, PasswordStrengthIndicator } from '@/components/password-strength-indicator';
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
    Modal,
    ModalContent,
    ModalDescription,
    ModalFooter,
    ModalHeader,
    ModalTitle,
    ModalTrigger,
} from '@/components/ui/modal';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import AdminLayout from '@/layouts/admin-layout';
import { dashboard, userManagement } from '@/routes';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Users,
    Search,
    Filter,
    Plus,
    Edit,
    UserCheck,
    UserX,
    Settings,
    ChevronLeft,
    ChevronRight,
    Eye,
    EyeOff,
    Download,
    Loader2,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface User {
    id: number;
    name: string;
    clinicName: string;
    email: string;
    role: 'admin' | 'clinic';
    status: 'active' | 'inactive' | 'suspended';
    lastLogin: string | null;
    createdAt: string;
}

interface Stats {
    totalUsers: number;
    activeUsers: number;
    staffUsers: number;
    adminUsers: number;
}

interface Props {
    users: User[];
    stats: Stats;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User Management',
        href: userManagement.url(),
    },
];

export default function UserManagement({ users, stats }: Props) {
    const { auth } = usePage<SharedData>().props;
    const currentUserId = Number((auth.user as { id?: number })?.id ?? 0);
    const { success, error } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportFilters, setExportFilters] = useState({
        role: 'all',
        status: 'all',
        date_from: '',
        date_to: '',
    });
    const perPage = 10;

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'clinic',
        status: 'active',
        clinic_name: '',
    });

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                user.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = selectedRole === 'all' || user.role === selectedRole;
            const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchTerm, selectedRole, selectedStatus]);

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / perPage);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * perPage, currentPage * perPage);

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'border-transparent bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200';
            case 'clinic':
                return 'border-transparent bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200';
            default:
                return 'border-transparent bg-gray-50 text-gray-700 dark:border-gray-400/30 dark:bg-gray-500/10 dark:text-gray-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'border-transparent bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200';
            case 'inactive':
                return 'border-transparent bg-gray-50 text-gray-700 dark:border-gray-400/30 dark:bg-gray-500/10 dark:text-gray-200';
            case 'suspended':
                return 'border-transparent bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200';
            default:
                return 'border-transparent bg-gray-50 text-gray-700 dark:border-gray-400/30 dark:bg-gray-500/10 dark:text-gray-200';
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatLastLogin = (dateString: string | null) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffHours < 168) {
            return `${Math.floor(diffHours / 24)}d ago`;
        } else {
            return formatDate(dateString);
        }
    };

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        post('/user-management', {
            onSuccess: () => {
                success('User created successfully!');
                setIsAddModalOpen(false);
                reset();
            },
            onError: (err) => {
                if (err.email) error(err.email);
                if (err.password) error(err.password);
            },
        });
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setData({
            name: user.name,
            email: user.email,
            password: '',
            password_confirmation: '',
            role: user.role,
            status: user.status,
            clinic_name: user.clinicName || '',
        });
        setIsEditModalOpen(true);
    };

    const handleEditUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        put(`/user-management/${editingUser.id}`, {
            onSuccess: () => {
                success('User updated successfully!');
                setIsEditModalOpen(false);
                setEditingUser(null);
                reset();
            },
            onError: (err) => {
                if (err.email) error(err.email);
            },
        });
    };

    const handleToggleStatus = (user: User) => {
        router.patch(`/user-management/${user.id}/toggle-status`, {}, {
            onSuccess: () => {
                success('User status updated!');
            },
        });
    };

    const handleDeleteUser = (user: User) => {
        if (user.id === currentUserId) {
            error('You cannot delete your own account.');
            return;
        }

        if (!window.confirm(`Delete ${user.name}? This action cannot be undone.`)) {
            return;
        }

        router.delete(`/user-management/${user.id}`, {
            onSuccess: () => {
                success('User deleted successfully!');
            },
            onError: () => {
                error('Failed to delete user.');
            },
        });
    };

    const openExportModal = () => {
        setExportFilters({
            role: selectedRole,
            status: selectedStatus,
            date_from: '',
            date_to: '',
        });
        setIsExporting(false);
        setIsExportModalOpen(true);
    };

    const closeExportModal = () => {
        setIsExporting(false);
        setIsExportModalOpen(false);
    };

    const handleExport = (e: React.FormEvent) => {
        e.preventDefault();
        if (isExporting) return;
        setIsExporting(true);

        const params = new URLSearchParams();
        if (exportFilters.role && exportFilters.role !== 'all') {
            params.append('role', exportFilters.role);
        }
        if (exportFilters.status && exportFilters.status !== 'all') {
            params.append('status', exportFilters.status);
        }
        if (exportFilters.date_from) {
            params.append('date_from', exportFilters.date_from);
        }
        if (exportFilters.date_to) {
            params.append('date_to', exportFilters.date_to);
        }

        const query = params.toString();
        const url = query ? `/user-management/export?${query}` : '/user-management/export';

        success('Preparing users Excel export...');
        window.location.href = url;

        setTimeout(() => {
            setIsExporting(false);
            setIsExportModalOpen(false);
        }, 1200);
    };

    return (
        <AdminLayout
            breadcrumbs={breadcrumbs}
            title="User Management"
            description="Manage system users, roles, permissions, and access control for your veterinary clinic."
        >
            <Head title="User Management" />

            {/* User Statistics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            Registered system users
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <UserCheck className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{stats.activeUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            Currently active accounts
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clinic Accounts</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.staffUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            Registered clinics
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                        <Settings className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.adminUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            System administrators
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Users Table */}
            <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>System Users</CardTitle>
                            <CardDescription>
                                Manage user accounts, roles, and permissions
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={openExportModal}>
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                            <Modal open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                                <ModalTrigger asChild>
                                    <Button size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add User
                                    </Button>
                                </ModalTrigger>
                            <ModalContent className="max-w-lg">
                                <form onSubmit={handleAddUser}>
                                    <ModalHeader>
                                        <ModalTitle>Add New User</ModalTitle>
                                        <ModalDescription>
                                            Create a new user account with appropriate role.
                                        </ModalDescription>
                                    </ModalHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Full Name *</label>
                                            <Input
                                                placeholder="e.g., Dr. John Smith"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Email *</label>
                                            <Input
                                                type="email"
                                                placeholder="john.smith@smartvet.com"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                required
                                            />
                                            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                                        </div>
                                        {data.role === 'clinic' && (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Clinic Name *</label>
                                                <Input
                                                    placeholder="e.g., SmartVet Animal Clinic"
                                                    value={data.clinic_name}
                                                    onChange={(e) => setData('clinic_name', e.target.value)}
                                                    required
                                                />
                                                {errors.clinic_name && <p className="text-sm text-red-500">{errors.clinic_name}</p>}
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Password *</label>
                                                <div className="relative">
                                                    <Input
                                                        type={showPassword ? 'text' : 'password'}
                                                        placeholder="••••••••"
                                                        value={data.password}
                                                        onChange={(e) => setData('password', e.target.value)}
                                                        required
                                                        className="pr-10"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                                <PasswordStrengthIndicator password={data.password} />
                                                <InputError message={errors.password} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Confirm Password *</label>
                                                <div className="relative">
                                                    <Input
                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                        placeholder="••••••••"
                                                        value={data.password_confirmation}
                                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                                        required
                                                        className="pr-10"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    >
                                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                                <PasswordMatchIndicator password={data.password} confirmation={data.password_confirmation} />
                                                <InputError message={errors.password_confirmation} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Role *</label>
                                            <Select
                                                value={data.role}
                                                onValueChange={(value) => {
                                                    setData('role', value);
                                                    if (value !== 'clinic') {
                                                        setData('clinic_name', '');
                                                    }
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin">Administrator</SelectItem>
                                                    <SelectItem value="clinic">Clinic</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <ModalFooter>
                                        <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); reset(); }}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={processing}>
                                            {processing ? 'Creating...' : 'Create User'}
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
                                    <ModalTitle>Export Users</ModalTitle>
                                    <ModalDescription>
                                        Choose which users to include in the Excel export.
                                    </ModalDescription>
                                </ModalHeader>
                                <form onSubmit={handleExport}>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Role</label>
                                            <Select
                                                value={exportFilters.role}
                                                onValueChange={(value) =>
                                                    setExportFilters((prev) => ({ ...prev, role: value }))
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="All roles" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Roles</SelectItem>
                                                    <SelectItem value="admin">Administrator</SelectItem>
                                                    <SelectItem value="clinic">Clinic</SelectItem>
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
                                                    <SelectItem value="suspended">Suspended</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Date From</label>
                                                <Input
                                                    type="date"
                                                    value={exportFilters.date_from}
                                                    onChange={(e) =>
                                                        setExportFilters((prev) => ({
                                                            ...prev,
                                                            date_from: e.target.value,
                                                        }))
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Date To</label>
                                                <Input
                                                    type="date"
                                                    value={exportFilters.date_to}
                                                    onChange={(e) =>
                                                        setExportFilters((prev) => ({
                                                            ...prev,
                                                            date_to: e.target.value,
                                                        }))
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <p className="text-xs text-neutral-500">
                                            The exported file will include the selected filters and can be opened in Excel or Google Sheets.
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
                                                <span className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Preparing...
                                                </span>
                                            ) : (
                                                'Export to Excel'
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
                    <div className="flex flex-col gap-4 md:flex-row md:items-center mb-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users or emails..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Select value={selectedRole} onValueChange={(v) => { setSelectedRole(v); setCurrentPage(1); }}>
                                <SelectTrigger className="w-[140px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="admin">Administrator</SelectItem>
                                    <SelectItem value="clinic">Clinic</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v); setCurrentPage(1); }}>
                                <SelectTrigger className="w-[120px]">
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
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Login</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                                                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                <span className="font-medium">{user.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("text-xs", getRoleColor(user.role))}>
                                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("text-xs", getStatusColor(user.status))}>
                                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatLastLogin(user.lastLogin)}</TableCell>
                                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditModal(user)}
                                                >
                                                    <Edit className="h-4 w-4 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={user.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-700'}
                                                    onClick={() => handleToggleStatus(user)}
                                                >
                                                    {user.status === 'active' ? (
                                                        <>
                                                            <UserX className="h-4 w-4 mr-1" />
                                                            Suspend
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UserCheck className="h-4 w-4 mr-1" />
                                                            Activate
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700"
                                                    onClick={() => handleDeleteUser(user)}
                                                    disabled={user.id === currentUserId}
                                                    title={user.id === currentUserId ? 'Cannot delete your own account' : 'Delete user'}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" />
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
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-muted-foreground">
                                Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, filteredUsers.length)} of {filteredUsers.length} users
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm">Page {currentPage} of {totalPages}</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit User Modal */}
            <Modal open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <ModalContent className="max-w-lg">
                    <form onSubmit={handleEditUser}>
                        <ModalHeader>
                            <ModalTitle>Edit User</ModalTitle>
                            <ModalDescription>
                                Update user account details.
                            </ModalDescription>
                        </ModalHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name *</label>
                                <Input
                                    placeholder="e.g., Dr. John Smith"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email *</label>
                                <Input
                                    type="email"
                                    placeholder="john.smith@smartvet.com"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Role *</label>
                                    <Select
                                        value={data.role}
                                        disabled={editingUser?.role === 'clinic'}
                                        onValueChange={(value) => {
                                            if (editingUser?.role === 'clinic') {
                                                return;
                                            }
                                            setData('role', value);
                                            if (value !== 'clinic') {
                                                setData('clinic_name', '');
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Administrator</SelectItem>
                                            <SelectItem value="clinic">Clinic</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Status *</label>
                                    <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                            <SelectItem value="suspended">Suspended</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {data.role === 'clinic' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Clinic Name *</label>
                                    <Input
                                        placeholder="e.g., SmartVet Animal Clinic"
                                        value={data.clinic_name}
                                        onChange={(e) => setData('clinic_name', e.target.value)}
                                        required
                                    />
                                    {errors.clinic_name && <p className="text-sm text-red-500">{errors.clinic_name}</p>}
                                </div>
                            )}
                        </div>
                        <ModalFooter>
                            <Button type="button" variant="outline" onClick={() => { setIsEditModalOpen(false); setEditingUser(null); reset(); }}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </AdminLayout>
    );
}
