import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import { useState } from 'react';

interface ConsultationType {
    id: number;
    slug: string;
    name: string;
    fee: number;
    description: string | null;
}

interface ConsultationTypesPageProps {
    types: ConsultationType[];
}

export default function ConsultationTypes({ types }: ConsultationTypesPageProps) {
    const { auth } = usePage<SharedData>().props;
    const themeColor = (auth.user as { theme_color?: string })?.theme_color || '#0f172a';
    const { success, error } = useToast();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<ConsultationType | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        fee: '',
        description: '',
    });

    const { data: editData, setData: setEditData, put, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
        name: '',
        fee: '',
        description: '',
    });

    const { delete: deleteType, processing: deleteProcessing } = useForm({});

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Consultation Types', href: '/consultation-types' },
    ];

    const openCreateModal = () => {
        reset();
        setIsCreateOpen(true);
    };

    const handleCreate = (event: React.FormEvent) => {
        event.preventDefault();

        post('/consultation-types', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
                success('Consultation type added successfully!');
            },
            onError: () => {
                error('Unable to add consultation type. Please check the form and try again.');
            },
        });
    };

    const openEditModal = (type: ConsultationType) => {
        setSelectedType(type);
        setEditData('name', type.name);
        setEditData('fee', type.fee.toString());
        setEditData('description', type.description ?? '');
        setIsEditOpen(true);
    };

    const closeEditModal = () => {
        setIsEditOpen(false);
        setSelectedType(null);
        resetEdit();
    };

    const handleUpdate = (event: React.FormEvent) => {
        event.preventDefault();

        if (!selectedType) {
            return;
        }

        put(`/consultation-types/${selectedType.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                closeEditModal();
                success('Consultation type updated successfully!');
            },
            onError: () => {
                error('Unable to update consultation type. Please check the form and try again.');
            },
        });
    };

    const handleDelete = (type: ConsultationType) => {
        deleteType(`/consultation-types/${type.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                success('Consultation type deleted successfully!');
            },
            onError: () => {
                error('Unable to delete consultation type. Please try again.');
            },
        });
    };

    return (
        <AdminLayout
            title="Consultation Types"
            description="Create and manage your clinic’s own consultation service types and fees."
            breadcrumbs={breadcrumbs}
        >
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Available consultation types</CardTitle>
                        <CardDescription>
                            These types are available when recording new consultations in your clinic dashboard.
                        </CardDescription>
                    </div>
                    <Button onClick={openCreateModal} className="text-white" style={{ backgroundColor: themeColor, borderColor: themeColor }}>
                        <Plus className="mr-2 h-4 w-4" /> Create Type
                    </Button>
                </CardHeader>
                <CardContent>
                    {types.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-muted p-6 text-center text-sm text-muted-foreground">
                            No consultation types have been defined yet. Create one to start using it for consultations.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Fee</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {types.map((type) => (
                                    <TableRow key={type.id}>
                                        <TableCell>{type.name}</TableCell>
                                        <TableCell>₱{type.fee.toFixed(2)}</TableCell>
                                        <TableCell>{type.description || '—'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="secondary" size="sm" onClick={() => openEditModal(type)}>
                                                    <Edit className="mr-2 h-3.5 w-3.5" /> Edit
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleDelete(type)} disabled={deleteProcessing}>
                                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Consultation Type</DialogTitle>
                        <DialogDescription>
                            Add a new consultation service type with a custom fee and description.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(event) => setData('name', event.target.value)}
                                required
                            />
                            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <Label htmlFor="fee">Fee</Label>
                            <Input
                                id="fee"
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.fee}
                                onChange={(event) => setData('fee', event.target.value)}
                                required
                            />
                            {errors.fee && <p className="text-sm text-destructive mt-1">{errors.fee}</p>}
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(event) => setData('description', event.target.value)}
                                rows={3}
                            />
                            {errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                <Save className="mr-2 h-4 w-4" /> Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Consultation Type</DialogTitle>
                        <DialogDescription>
                            Update the type name, fee, or description for this consultation service.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={editData.name}
                                onChange={(event) => setEditData('name', event.target.value)}
                                required
                            />
                            {editErrors.name && <p className="text-sm text-destructive mt-1">{editErrors.name}</p>}
                        </div>
                        <div>
                            <Label htmlFor="edit-fee">Fee</Label>
                            <Input
                                id="edit-fee"
                                type="number"
                                step="0.01"
                                min="0"
                                value={editData.fee}
                                onChange={(event) => setEditData('fee', event.target.value)}
                                required
                            />
                            {editErrors.fee && <p className="text-sm text-destructive mt-1">{editErrors.fee}</p>}
                        </div>
                        <div>
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                value={editData.description}
                                onChange={(event) => setEditData('description', event.target.value)}
                                rows={3}
                            />
                            {editErrors.description && <p className="text-sm text-destructive mt-1">{editErrors.description}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={closeEditModal}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editProcessing}>
                                <Save className="mr-2 h-4 w-4" /> Update
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
