import AdminLayout from '@/layouts/admin-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { type SharedData } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';

interface PetOption {
    id: number;
    name: string;
    ownerName: string;
}

interface InventoryOption {
    id: number;
    name: string;
    brand: string;
    batchNumber: string;
    currentStock: number;
    unitPrice: number;
    expiryDate: string | null;
    categoryName: string;
}

interface LineItem {
    inventory_item_id: number | '';
    quantity: number;
    unit_price: number;
}

interface Props {
    pets: PetOption[];
    inventoryItems: InventoryOption[];
}

interface PageProps extends SharedData {
    [key: string]: unknown;
    errors?: Record<string, string | string[]>;
    flash?: {
        success?: string;
        error?: string;
        [key: string]: any;
    };
}

export default function MedicationSales({ pets, inventoryItems }: Props) {
    const { props } = usePage<PageProps>();
    const errors = (props.errors ?? {}) as Record<string, string[]>;
    const { success, error } = useToast();

    const [petId, setPetId] = useState<number | 'walkin' | ''>('');
    const [customerName, setCustomerName] = useState('');
    const [notes, setNotes] = useState('');
    const [lineItems, setLineItems] = useState<LineItem[]>([
        { inventory_item_id: '', quantity: 1, unit_price: 0 },
    ]);
    const [submitting, setSubmitting] = useState(false);

    const selectedItemMap = useMemo(() => {
        return inventoryItems.reduce((acc, item) => {
            acc[item.id] = item;
            return acc;
        }, {} as Record<number, InventoryOption>);
    }, [inventoryItems]);

    const totalAmount = useMemo(() => {
        return lineItems.reduce((sum, line) => {
            if (!line.inventory_item_id || line.quantity <= 0) {
                return sum;
            }
            return sum + line.unit_price * line.quantity;
        }, 0);
    }, [lineItems]);

    const handleLineChange = (index: number, field: keyof LineItem, value: string | number) => {
        setLineItems((current) =>
            current.map((line, lineIndex) => {
                if (lineIndex !== index) return line;
                if (field === 'inventory_item_id') {
                        const itemId = Number(value);
                        const item = selectedItemMap[itemId];
                    return {
                        inventory_item_id: itemId,
                        quantity: 1,
                        unit_price: item ? item.unitPrice : 0,
                    };
                }
                return {
                    ...line,
                    [field]: typeof value === 'string' ? Number(value) || 0 : value,
                };
            }),
        );
    };

    const addLineItem = () => {
        setLineItems((current) => [...current, { inventory_item_id: '', quantity: 1, unit_price: 0 }]);
    };

    const removeLineItem = (index: number) => {
        setLineItems((current) => current.filter((_, lineIndex) => lineIndex !== index));
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const filteredItems = lineItems
            .filter((item) => item.inventory_item_id && item.quantity > 0)
            .map((item) => ({
                inventory_item_id: item.inventory_item_id,
                quantity: item.quantity,
            }));

        if (filteredItems.length === 0 || (!petId && !customerName.trim())) {
            return;
        }

        const pet_id = petId === 'walkin' ? null : petId || null;

        setSubmitting(true);

        router.post('/medication-sales', {
            pet_id,
            customer_name: customerName || null,
            notes,
            inventory_items: filteredItems,
        }, {
            onSuccess: () => {
                success('Success');
            },
            onError: (serverErrors) => {
                const errorMessage = serverErrors.general
                    ? Array.isArray(serverErrors.general)
                        ? serverErrors.general[0]
                        : serverErrors.general
                    : 'Please review the form and try again.';
                error(errorMessage);
            },
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <AdminLayout
            title="Inventory Sales"
            description="Sell inventory products"
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Inventory Sales', href: '/medication-sales' },
            ]}
        >
            <Head title="Inventory Sales" />

            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>New Inventory Sale</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {(props.flash?.error || errors.general) && (
                                <div className="flex w-full justify-end">
                                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 max-w-xl">
                                        {props.flash?.error || (Array.isArray(errors.general) ? errors.general[0] : errors.general)}
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="pet">Pet</Label>
                                    <Select
                                        value={petId?.toString() ?? ''}
                                        onValueChange={(value) => setPetId(value === 'walkin' ? 'walkin' : value ? Number(value) : '')}
                                    >
                                        <SelectTrigger id="pet" className="h-11">
                                            <SelectValue placeholder="Select pet (or choose walk-in)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="walkin">Walk-in / no pet</SelectItem>
                                            {pets.map((pet) => (
                                                <SelectItem key={pet.id} value={pet.id.toString()}>
                                                    {pet.name} — {pet.ownerName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.pet_id && <p className="text-sm text-red-600">{errors.pet_id[0]}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="customer_name">Walk-in Customer Name</Label>
                                    <Input
                                        id="customer_name"
                                        value={customerName}
                                        onChange={(event) => setCustomerName(event.target.value)}
                                        placeholder="Enter customer name when no pet is registered"
                                        className="h-11"
                                    />
                                    {errors.customer_name && <p className="text-sm text-red-600">{errors.customer_name[0]}</p>}
                                </div>
                                <div className="grid gap-2 md:col-span-2">
                                    <Label htmlFor="notes">Sale Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={notes}
                                        onChange={(event) => setNotes(event.target.value)}
                                        placeholder="Optional notes for this sale"
                                        className="resize-none"
                                        rows={4}
                                    />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
                                <div className="hidden gap-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 md:grid md:grid-cols-[1.3fr_0.8fr_0.8fr_0.4fr]">
                                    <span>Product</span>
                                    <span>Quantity</span>
                                    <span>Unit Price</span>
                                    <span className="text-right">Action</span>
                                </div>
                                <div className="space-y-4">
                                    {lineItems.map((lineItem, index) => (
                                        <div key={index} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1.3fr_0.8fr_0.8fr_0.4fr]">
                                            <div className="grid gap-2">
                                                <Label htmlFor={`item-${index}`}>Product</Label>
                                                <Select
                                                    value={lineItem.inventory_item_id?.toString() ?? ''}
                                                    onValueChange={(value) => handleLineChange(index, 'inventory_item_id', value)}
                                                >
                                                    <SelectTrigger id={`item-${index}`} className="h-11">
                                                        <SelectValue placeholder="Select product" />
                                                    </SelectTrigger>
                                                    <SelectContent className="w-[500px] max-h-[400px]">
                                                        {inventoryItems.map((item) => (
                                                            <SelectItem key={item.id} value={item.id.toString()}>
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="font-medium">{item.name}</span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {item.brand ? `${item.brand} • ` : ''}{item.categoryName} • {item.currentStock} in stock
                                                                    </span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors[`inventory_items.${index}.inventory_item_id`] && (
                                                    <p className="text-sm text-red-600">{errors[`inventory_items.${index}.inventory_item_id`][0]}</p>
                                                )}
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor={`qty-${index}`}>Quantity</Label>
                                                <Input
                                                    id={`qty-${index}`}
                                                    type="number"
                                                    min="1"
                                                    value={lineItem.quantity}
                                                    onChange={(event) => handleLineChange(index, 'quantity', Number(event.target.value))}
                                                    className="h-11"
                                                />
                                                {errors[`inventory_items.${index}.quantity`] && (
                                                    <p className="text-sm text-red-600">{errors[`inventory_items.${index}.quantity`][0]}</p>
                                                )}
                                            </div>

                                            <div className="grid gap-2">
                                                <Label>Unit Price</Label>
                                                <Input value={`₱${lineItem.unit_price.toFixed(2)}`} readOnly className="h-11 bg-white/80" />
                                            </div>

                                            <div className="flex items-end justify-end">
                                                <Button type="button" variant="ghost" onClick={() => removeLineItem(index)} disabled={lineItems.length === 1} className="h-11 w-full">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <Button type="button" variant="outline" onClick={addLineItem} className="w-full lg:w-auto">
                                    <Plus className="mr-2 h-4 w-4" /> Add another product
                                </Button>
                                <div className="rounded-2xl bg-slate-100 p-4 text-right">
                                    <p className="text-sm text-muted-foreground">Estimated Total</p>
                                    <p className="text-2xl font-semibold">₱{totalAmount.toFixed(2)}</p>
                                </div>
                            </div>

                            {errors.inventory_items && (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                    {errors.inventory_items[0]}
                                </div>
                            )}

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                                <Button
                                    type="submit"
                                    disabled={submitting || (!petId && !customerName.trim()) || totalAmount <= 0}
                                >
                                    {submitting ? 'Saving...' : 'Create Inventory Sale'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Medications/Products</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3">
                            {inventoryItems.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No inventory products are currently in stock.</p>
                            ) : (
                                inventoryItems.map((item) => (
                                    <div key={item.id} className="rounded-2xl border border-slate-200 p-4 bg-white/90">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-semibold">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {item.brand ? `${item.brand} · ` : ''}
                                                    {item.categoryName} · Batch {item.batchNumber || '–'}
                                                </p>
                                            </div>
                                            <p className="text-sm font-semibold">₱{item.unitPrice.toFixed(2)}</p>
                                        </div>
                                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                            <div>Stock: {item.currentStock}</div>
                                            <div>Expiry: {item.expiryDate || 'N/A'}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
