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
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useToast } from '@/hooks/use-toast';
import {
    AlertTriangle,
    Package,
    Search,
    TrendingDown,
    TrendingUp,
    XCircle,
    Plus,
    Filter,
    Download,
    Loader2,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';

interface InventoryItem {
    dbId: number;
    id: string;
    name: string;
    brand: string;
    batchNumber: string;
    categoryId: number;
    categorySlug: string;
    categoryName: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
    unitPrice: number;
    expiryDate: string | null;
    supplier: string | null;
    location: string | null;
    description: string | null;
    lastRestocked: string | null;
}

interface Category {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
}

interface InventoryPageProps {
    categories: Category[];
    items: InventoryItem[];
}

const formatPeso = (value: number) =>
    `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

const getStockLevel = (item: InventoryItem): 'in-stock' | 'low-stock' | 'out-of-stock' => {
    if (item.currentStock === 0) return 'out-of-stock';
    if (item.currentStock <= item.minStock) return 'low-stock';
    return 'in-stock';
};

const getStockLevelColor = (status: string) => {
    switch (status) {
        case 'in-stock':
            return 'border-transparent bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200';
        case 'low-stock':
            return 'border-transparent bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200';
        case 'out-of-stock':
            return 'border-transparent bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200';
        default:
            return 'border-transparent bg-neutral-50 text-neutral-700 dark:border-neutral-400/30 dark:bg-neutral-500/10 dark:text-neutral-200';
    }
};

const getStockIcon = (status: string) => {
    switch (status) {
        case 'in-stock':
            return <TrendingUp className="h-4 w-4" />;
        case 'low-stock':
            return <AlertTriangle className="h-4 w-4" />;
        case 'out-of-stock':
            return <XCircle className="h-4 w-4" />;
        default:
            return <Package className="h-4 w-4" />;
    }
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard.url(),
    },
    {
        title: 'Inventory Management',
        href: '/inventory-management',
    },
];

export default function InventoryManagement({ categories, items }: InventoryPageProps) {
    const { auth } = usePage<SharedData>().props;
    const themeColor = (auth.user as { theme_color?: string })?.theme_color || '#0f172a';
    const { success } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
    const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
    const [actionSelections, setActionSelections] = useState<Partial<Record<number, string>>>({});
    const [exportFilters, setExportFilters] = useState({
        category: 'all',
        status: 'all',
        date_from: '',
        date_to: '',
    });

    const defaultCategoryId = categories[0]?.id ?? '';

    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
    } = useForm({
        name: '',
        brand: '',
        batch_number: '',
        inventory_category_id: defaultCategoryId,
        current_stock: 0,
        min_stock: 0,
        max_stock: 0,
        unit_price: 0,
        expiry_date: '',
        supplier: '',
        location: '',
        description: '',
    });

    const {
        data: editData,
        setData: setEditData,
        put: submitEdit,
        processing: editProcessing,
        errors: editErrors,
        reset: resetEdit,
    } = useForm({
        name: '',
        brand: '',
        batch_number: '',
        inventory_category_id: defaultCategoryId,
        current_stock: 0,
        min_stock: 0,
        max_stock: 0,
        unit_price: 0,
        expiry_date: '',
        supplier: '',
        location: '',
        description: '',
    });

    const {
        data: restockData,
        setData: setRestockData,
        post: submitRestock,
        processing: restockProcessing,
        errors: restockErrors,
        reset: resetRestock,
    } = useForm({
        quantity: 0,
        unit_price: '',
        expiry_date: '',
    });

    const {
        delete: destroyItem,
        processing: deleteProcessing,
    } = useForm({});

    const handleAddItem = (e: FormEvent) => {
        e.preventDefault();

        post('/inventory-management', {
            preserveScroll: true,
            onSuccess: () => {
                setIsAddModalOpen(false);
                reset();
                success('Inventory item added successfully!');
            },
        });
    };

    const openEditModal = (item: InventoryItem) => {
        setEditingItem(item);
        setEditData('name', item.name);
        setEditData('brand', item.brand ?? '');
        setEditData('batch_number', item.batchNumber ?? '');
        setEditData('inventory_category_id', item.categoryId || defaultCategoryId);
        setEditData('current_stock', item.currentStock);
        setEditData('min_stock', item.minStock);
        setEditData('max_stock', item.maxStock);
        setEditData('unit_price', item.unitPrice);
        setEditData('expiry_date', item.expiryDate ?? '');
        setEditData('supplier', item.supplier ?? '');
        setEditData('location', item.location ?? '');
        setEditData('description', item.description ?? '');
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingItem(null);
        resetEdit();
    };

    const handleEditItem = (e: FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;

        submitEdit(`/inventory-management/${editingItem.dbId}`, {
            preserveScroll: true,
            onSuccess: () => {
                closeEditModal();
                success('Inventory item updated successfully!');
            },
        });
    };

    const openRestockModal = (item: InventoryItem) => {
        setRestockItem(item);
        setRestockData('quantity', 0);
        setRestockData('unit_price', item.unitPrice ? item.unitPrice.toString() : '');
        setRestockData('expiry_date', item.expiryDate ?? '');
        setIsRestockModalOpen(true);
    };

    const closeRestockModal = () => {
        setIsRestockModalOpen(false);
        setRestockItem(null);
        resetRestock();
    };

    const handleRestockItem = (e: FormEvent) => {
        e.preventDefault();
        if (!restockItem) return;

        submitRestock(`/inventory-management/${restockItem.dbId}/restock`, {
            preserveScroll: true,
            onSuccess: () => {
                closeRestockModal();
                success('Inventory stock updated!');
            },
        });
    };

    const openDeleteModal = (item: InventoryItem) => {
        setDeletingItem(item);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeletingItem(null);
        setIsDeleteModalOpen(false);
    };

    const handleDeleteItem = (e: FormEvent) => {
        e.preventDefault();
        if (!deletingItem) return;

        destroyItem(`/inventory-management/${deletingItem.dbId}`, {
            preserveScroll: true,
            onSuccess: () => {
                closeDeleteModal();
                success('Inventory item deleted successfully!');
            },
        });
    };

    const resetActionSelection = (itemId: number) => {
        setActionSelections((prev) => {
            const updated = { ...prev };
            delete updated[itemId];
            return updated;
        });
    };

    const handleActionSelection = (item: InventoryItem, action: string) => {
        if (!action) return;

        setActionSelections((prev) => ({ ...prev, [item.dbId]: action }));

        switch (action) {
            case 'edit':
                openEditModal(item);
                break;
            case 'restock':
                openRestockModal(item);
                break;
            case 'delete':
                openDeleteModal(item);
                break;
            default:
                break;
        }

        setTimeout(() => resetActionSelection(item.dbId), 0);
    };

    const openExportModal = () => {
        setExportFilters({
            category: selectedCategory,
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

    const handleExport = (e: FormEvent) => {
        e.preventDefault();
        if (isExporting) return;
        setIsExporting(true);

        const params = new URLSearchParams();
        if (exportFilters.category && exportFilters.category !== 'all') {
            params.append('category', exportFilters.category);
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
        const url = query ? `/inventory-management/export?${query}` : '/inventory-management/export';

        success('Preparing inventory Excel export...');
        window.location.href = url;

        setTimeout(() => {
            setIsExporting(false);
            setIsExportModalOpen(false);
        }, 1200);
    };

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const matchesSearch =
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.id.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory =
                selectedCategory === 'all' || item.categorySlug === selectedCategory;

            const itemStatus = getStockLevel(item);
            const matchesStatus =
                selectedStatus === 'all' || itemStatus === selectedStatus;

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [items, searchTerm, selectedCategory, selectedStatus]);

    const inventoryStats = useMemo(() => {
        const totalItems = items.length;
        const inStock = items.filter(item => getStockLevel(item) === 'in-stock').length;
        const lowStock = items.filter(item => getStockLevel(item) === 'low-stock').length;
        const outOfStock = items.filter(item => getStockLevel(item) === 'out-of-stock').length;
        const totalValue = items.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0);

        return { totalItems, inStock, lowStock, outOfStock, totalValue };
    }, [items]);

    return (
        <AdminLayout
            breadcrumbs={breadcrumbs}
            title="Inventory Management"
            description="Track medical supplies, equipment, and medications across all clinic locations."
        >
            <Head title="Inventory Management" />

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{inventoryStats.totalItems}</div>
                        <p className="text-xs text-muted-foreground">
                            Across all categories
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Stock</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{inventoryStats.inStock}</div>
                        <p className="text-xs text-muted-foreground">
                            Items with adequate stock
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{inventoryStats.lowStock}</div>
                        <p className="text-xs text-muted-foreground">
                            Items needing restock
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPeso(inventoryStats.totalValue)}</div>
                        <p className="text-xs text-muted-foreground">
                            Current inventory value
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card className="border border-white/70 bg-white/95 shadow-lg dark:border-white/5 dark:bg-neutral-900">
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Inventory Items</CardTitle>
                            <CardDescription>
                                Manage stock levels and track supply chain metrics
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={openExportModal}>
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                            <Modal
                                open={isAddModalOpen}
                                onOpenChange={(open) => {
                                    setIsAddModalOpen(open);
                                    if (!open) {
                                        reset();
                                    }
                                }}
                            >
                                <ModalTrigger asChild>
                                    <Button size="sm" className="text-white" style={{ backgroundColor: themeColor, borderColor: themeColor }}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Item
                                    </Button>
                                </ModalTrigger>
                                <ModalContent className="max-w-2xl">
                                    <ModalHeader>
                                        <ModalTitle>Add New Inventory Item</ModalTitle>
                                        <ModalDescription>
                                            Enter the details for the new inventory item. All fields marked with * are required.
                                        </ModalDescription>
                                    </ModalHeader>
                                    <form onSubmit={handleAddItem}>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Item Name *</label>
                                                    <Input
                                                        placeholder="e.g., Amoxicillin 500mg"
                                                        value={data.name}
                                                        onChange={(e) => setData('name', e.target.value)}
                                                        disabled={processing}
                                                    />
                                                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Brand</label>
                                                    <Input
                                                        placeholder="e.g., Vetmedica"
                                                        value={data.brand}
                                                        onChange={(e) => setData('brand', e.target.value)}
                                                        disabled={processing}
                                                    />
                                                    {errors.brand && <p className="text-xs text-red-500">{errors.brand}</p>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Category *</label>
                                                    <Select
                                                        value={data.inventory_category_id ? String(data.inventory_category_id) : undefined}
                                                        onValueChange={(value) => setData('inventory_category_id', Number(value))}
                                                        disabled={processing || categories.length === 0}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select category" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {categories.map((category) => (
                                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                                    {category.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {errors.inventory_category_id && <p className="text-xs text-red-500">{errors.inventory_category_id}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Batch / Lot Number</label>
                                                    <Input
                                                        placeholder="e.g., LOT-2025-001"
                                                        value={data.batch_number}
                                                        onChange={(e) => setData('batch_number', e.target.value)}
                                                        disabled={processing}
                                                    />
                                                    {errors.batch_number && <p className="text-xs text-red-500">{errors.batch_number}</p>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Supplier</label>
                                                    <Input
                                                        placeholder="e.g., PharmVet Solutions"
                                                        value={data.supplier}
                                                        onChange={(e) => setData('supplier', e.target.value)}
                                                        disabled={processing}
                                                    />
                                                    {errors.supplier && <p className="text-xs text-red-500">{errors.supplier}</p>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Current Stock *</label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={data.current_stock}
                                                        onChange={(e) => setData('current_stock', Number(e.target.value) || 0)}
                                                        disabled={processing}
                                                    />
                                                    {errors.current_stock && <p className="text-xs text-red-500">{errors.current_stock}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Min Stock *</label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={data.min_stock}
                                                        onChange={(e) => setData('min_stock', Number(e.target.value) || 0)}
                                                        disabled={processing}
                                                    />
                                                    {errors.min_stock && <p className="text-xs text-red-500">{errors.min_stock}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Max Stock *</label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={data.max_stock}
                                                        onChange={(e) => setData('max_stock', Number(e.target.value) || 0)}
                                                        disabled={processing}
                                                    />
                                                    {errors.max_stock && <p className="text-xs text-red-500">{errors.max_stock}</p>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Unit Price (₱) *</label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={data.unit_price}
                                                        onChange={(e) => setData('unit_price', parseFloat(e.target.value) || 0)}
                                                        disabled={processing}
                                                    />
                                                    {errors.unit_price && <p className="text-xs text-red-500">{errors.unit_price}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Expiry Date</label>
                                                    <Input
                                                        type="date"
                                                        value={data.expiry_date}
                                                        onChange={(e) => setData('expiry_date', e.target.value)}
                                                        disabled={processing}
                                                    />
                                                    {errors.expiry_date && <p className="text-xs text-red-500">{errors.expiry_date}</p>}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Location</label>
                                                <Input
                                                    placeholder="e.g., Cabinet A-1, Storage Room C-1"
                                                    value={data.location}
                                                    onChange={(e) => setData('location', e.target.value)}
                                                    disabled={processing}
                                                />
                                                {errors.location && <p className="text-xs text-red-500">{errors.location}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Description</label>
                                                <Textarea
                                                    placeholder="Brief description of the item"
                                                    value={data.description}
                                                    onChange={(e) => setData('description', e.target.value)}
                                                    disabled={processing}
                                                    rows={3}
                                                    className="resize-none"
                                                />
                                                {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
                                            </div>
                                        </div>
                                        <ModalFooter>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    reset();
                                                    setIsAddModalOpen(false);
                                                }}
                                                disabled={processing}
                                            >
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={processing || categories.length === 0} className="text-white" style={{ backgroundColor: themeColor, borderColor: themeColor }}>
                                                {processing ? 'Saving...' : 'Add Item'}
                                            </Button>
                                        </ModalFooter>
                                    </form>
                                </ModalContent>
                            </Modal>

                            <Modal
                                open={isEditModalOpen}
                                onOpenChange={(open) => {
                                    if (!open) {
                                        closeEditModal();
                                    }
                                }}
                            >
                                <ModalContent className="max-w-2xl">
                                    <ModalHeader>
                                        <ModalTitle>Edit Inventory Item</ModalTitle>
                                        <ModalDescription>
                                            Update the details for {editingItem?.name ?? 'this item'}.
                                        </ModalDescription>
                                    </ModalHeader>
                                    <form onSubmit={handleEditItem}>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Item Name *</label>
                                                    <Input
                                                        value={editData.name}
                                                        onChange={(e) => setEditData('name', e.target.value)}
                                                        disabled={editProcessing}
                                                    />
                                                    {editErrors.name && <p className="text-xs text-red-500">{editErrors.name}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Brand</label>
                                                    <Input
                                                        value={editData.brand}
                                                        onChange={(e) => setEditData('brand', e.target.value)}
                                                        disabled={editProcessing}
                                                    />
                                                    {editErrors.brand && <p className="text-xs text-red-500">{editErrors.brand}</p>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Category *</label>
                                                    <Select
                                                        value={editData.inventory_category_id ? String(editData.inventory_category_id) : undefined}
                                                        onValueChange={(value) => setEditData('inventory_category_id', Number(value))}
                                                        disabled={editProcessing || categories.length === 0}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select category" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {categories.map((category) => (
                                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                                    {category.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {editErrors.inventory_category_id && <p className="text-xs text-red-500">{editErrors.inventory_category_id}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Batch / Lot Number</label>
                                                    <Input
                                                        value={editData.batch_number}
                                                        onChange={(e) => setEditData('batch_number', e.target.value)}
                                                        disabled={editProcessing}
                                                    />
                                                    {editErrors.batch_number && <p className="text-xs text-red-500">{editErrors.batch_number}</p>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Supplier</label>
                                                    <Input
                                                        value={editData.supplier}
                                                        onChange={(e) => setEditData('supplier', e.target.value)}
                                                        disabled={editProcessing}
                                                    />
                                                    {editErrors.supplier && <p className="text-xs text-red-500">{editErrors.supplier}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Location</label>
                                                    <Input
                                                        value={editData.location}
                                                        onChange={(e) => setEditData('location', e.target.value)}
                                                        disabled={editProcessing}
                                                    />
                                                    {editErrors.location && <p className="text-xs text-red-500">{editErrors.location}</p>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Current Stock *</label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={editData.current_stock}
                                                        onChange={(e) => setEditData('current_stock', Number(e.target.value) || 0)}
                                                        disabled={editProcessing}
                                                    />
                                                    {editErrors.current_stock && <p className="text-xs text-red-500">{editErrors.current_stock}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Min Stock *</label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={editData.min_stock}
                                                        onChange={(e) => setEditData('min_stock', Number(e.target.value) || 0)}
                                                        disabled={editProcessing}
                                                    />
                                                    {editErrors.min_stock && <p className="text-xs text-red-500">{editErrors.min_stock}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Max Stock *</label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={editData.max_stock}
                                                        onChange={(e) => setEditData('max_stock', Number(e.target.value) || 0)}
                                                        disabled={editProcessing}
                                                    />
                                                    {editErrors.max_stock && <p className="text-xs text-red-500">{editErrors.max_stock}</p>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Unit Price (₱) *</label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={editData.unit_price}
                                                        onChange={(e) => setEditData('unit_price', parseFloat(e.target.value) || 0)}
                                                        disabled={editProcessing}
                                                    />
                                                    {editErrors.unit_price && <p className="text-xs text-red-500">{editErrors.unit_price}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Expiry Date</label>
                                                    <Input
                                                        type="date"
                                                        value={editData.expiry_date}
                                                        onChange={(e) => setEditData('expiry_date', e.target.value)}
                                                        disabled={editProcessing}
                                                    />
                                                    {editErrors.expiry_date && <p className="text-xs text-red-500">{editErrors.expiry_date}</p>}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Description</label>
                                                <Textarea
                                                    value={editData.description}
                                                    onChange={(e) => setEditData('description', e.target.value)}
                                                    disabled={editProcessing}
                                                    rows={3}
                                                    className="resize-none"
                                                />
                                                {editErrors.description && <p className="text-xs text-red-500">{editErrors.description}</p>}
                                            </div>
                                        </div>
                                        <ModalFooter>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={closeEditModal}
                                                disabled={editProcessing}
                                            >
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={editProcessing || !editingItem} className="text-white" style={{ backgroundColor: themeColor, borderColor: themeColor }}>
                                                {editProcessing ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                        </ModalFooter>
                                    </form>
                                </ModalContent>
                            </Modal>

                            <Modal
                                open={isRestockModalOpen}
                                onOpenChange={(open) => {
                                    if (!open) {
                                        closeRestockModal();
                                    }
                                }}
                            >
                                <ModalContent className="max-w-md">
                                    <ModalHeader>
                                        <ModalTitle>Restock Item</ModalTitle>
                                        <ModalDescription>
                                            Add new quantity for {restockItem?.name ?? 'this item'}.
                                        </ModalDescription>
                                    </ModalHeader>
                                    <form onSubmit={handleRestockItem}>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Quantity to Add *</label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={restockData.quantity}
                                                    onChange={(e) => setRestockData('quantity', Number(e.target.value) || 0)}
                                                    disabled={restockProcessing}
                                                />
                                                {restockErrors.quantity && <p className="text-xs text-red-500">{restockErrors.quantity}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Unit Price (₱)</label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={restockData.unit_price}
                                                    onChange={(e) => setRestockData('unit_price', e.target.value)}
                                                    disabled={restockProcessing}
                                                />
                                                {restockErrors.unit_price && <p className="text-xs text-red-500">{restockErrors.unit_price}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Expiry Date</label>
                                                <Input
                                                    type="date"
                                                    value={restockData.expiry_date}
                                                    onChange={(e) => setRestockData('expiry_date', e.target.value)}
                                                    disabled={restockProcessing}
                                                />
                                                {restockErrors.expiry_date && <p className="text-xs text-red-500">{restockErrors.expiry_date}</p>}
                                            </div>
                                        </div>
                                        <ModalFooter>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={closeRestockModal}
                                                disabled={restockProcessing}
                                            >
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={restockProcessing || !restockItem} className="text-white" style={{ backgroundColor: themeColor, borderColor: themeColor }}>
                                                {restockProcessing ? 'Restocking...' : 'Add Stock'}
                                            </Button>
                                        </ModalFooter>
                                    </form>
                                </ModalContent>
                            </Modal>

                            <Modal
                                open={isDeleteModalOpen}
                                onOpenChange={(open) => {
                                    if (!open) {
                                        closeDeleteModal();
                                    }
                                }}
                            >
                                <ModalContent className="max-w-md">
                                    <ModalHeader>
                                        <ModalTitle>Delete Inventory Item</ModalTitle>
                                        <ModalDescription>
                                            This action cannot be undone. Remove {deletingItem?.name ?? 'this item'} from inventory?
                                        </ModalDescription>
                                    </ModalHeader>
                                    <form onSubmit={handleDeleteItem}>
                                        <div className="py-4 text-sm text-neutral-600 dark:text-neutral-300">
                                            Deleting an item will permanently remove its stock record. Historical usage data is not affected.
                                        </div>
                                        <ModalFooter>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={closeDeleteModal}
                                                disabled={deleteProcessing}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                variant="destructive"
                                                disabled={deleteProcessing || !deletingItem}
                                            >
                                                {deleteProcessing ? 'Deleting...' : 'Delete Item'}
                                            </Button>
                                        </ModalFooter>
                                    </form>
                                </ModalContent>
                            </Modal>

                            <Modal
                                open={isExportModalOpen}
                                onOpenChange={(open) => {
                                    if (!open) {
                                        closeExportModal();
                                    }
                                }}
                            >
                                <ModalContent className="max-w-md">
                                    <ModalHeader>
                                        <ModalTitle>Export Inventory</ModalTitle>
                                        <ModalDescription>
                                            Choose which items to include in the Excel export.
                                        </ModalDescription>
                                    </ModalHeader>
                                    <form onSubmit={handleExport}>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Category</label>
                                                <Select
                                                    value={exportFilters.category}
                                                    onValueChange={(value) =>
                                                        setExportFilters((prev) => ({ ...prev, category: value }))
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="All categories" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Categories</SelectItem>
                                                        {categories.map((category) => (
                                                            <SelectItem key={category.id} value={category.slug}>
                                                                {category.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Stock Status</label>
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
                                                        <SelectItem value="in-stock">In Stock</SelectItem>
                                                        <SelectItem value="low-stock">Low Stock</SelectItem>
                                                        <SelectItem value="out-of-stock">Out of Stock</SelectItem>
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
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search items, brands, or IDs..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.slug}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="in-stock">In Stock</SelectItem>
                                    <SelectItem value="low-stock">Low Stock</SelectItem>
                                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Inventory Grid */}
            <Card className="border border-white/70 bg-white/95 shadow-lg dark:border-white/5 dark:bg-neutral-900">
                <CardContent className="p-6">
                    {/* Table Headers */}
                    <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border-b border-neutral-300 dark:border-neutral-700 mb-4">
                        <div>
                            <h3 className="font-semibold text-sm text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                                Item Details
                            </h3>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                                Stock Level
                            </h3>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                                Status
                            </h3>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                                Actions
                            </h3>
                        </div>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-400px)]">
                        {filteredItems.map((item) => {
                            const status = getStockLevel(item);
                            const totalValue = item.currentStock * item.unitPrice;

                            return (
                                <div key={item.id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border border-neutral-200 rounded-lg dark:border-neutral-800 items-center">
                                    <div className="min-w-0">
                                        <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                            {item.brand && item.brand !== 'null' ? item.brand : 'N/A'} • {item.id}
                                        </p>
                                        <p className="text-xs text-neutral-400 mt-1 truncate">
                                            {item.categoryName}
                                        </p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <span className="text-xs text-neutral-500 sm:hidden font-medium">Stock:</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">{item.currentStock}</span>
                                            <span className="text-xs text-neutral-500">
                                                / {item.maxStock}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <span className="text-xs text-neutral-500 sm:hidden font-medium">Status:</span>
                                        <Badge
                                            variant="outline"
                                            className={cn("capitalize text-xs w-fit", getStockLevelColor(status))}
                                        >
                                            <span className="flex items-center gap-1">
                                                {getStockIcon(status)}
                                                {status.replace('-', ' ')}
                                            </span>
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-2">
                                        <div className="hidden lg:block">
                                            <p className="font-medium text-sm">
                                                {formatPeso(item.unitPrice)}
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                Total: {formatPeso(totalValue)}
                                            </p>
                                        </div>

                                        <Select
                                            value={actionSelections[item.dbId]}
                                            onValueChange={(value) => handleActionSelection(item, value)}
                                        >
                                            <SelectTrigger className="w-[140px] text-xs">
                                                <SelectValue placeholder="Actions" />
                                            </SelectTrigger>
                                            <SelectContent align="end">
                                                <SelectItem value="edit">Edit Item</SelectItem>
                                                <SelectItem value="restock">Restock Item</SelectItem>
                                                <SelectItem value="delete">Delete Item</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredItems.length === 0 && (
                            <div className="text-center py-8 text-neutral-500">
                                No items found matching your criteria.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
            </AdminLayout>
    );
}
