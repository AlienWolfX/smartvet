import { useState, useEffect, useCallback } from 'react';
import { Bell, AlertTriangle, Clock, PackageX, PackageMinus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from '@inertiajs/react';

interface NotificationItem {
    id: number;
    type: 'expired' | 'expiring_soon' | 'out_of_stock' | 'low_stock';
    name: string;
    brand: string;
    itemCode: string;
    category: string;
    message: string;
    expiryDate?: string;
    daysAgo?: number;
    daysLeft?: number;
    currentStock?: number;
    minStock?: number;
}

interface NotificationData {
    totalCount: number;
    expired: NotificationItem[];
    expiringSoon: NotificationItem[];
    outOfStock: NotificationItem[];
    lowStock: NotificationItem[];
}

const REFRESH_INTERVAL = 60000; // 1 minute

export function NotificationBell() {
    const [data, setData] = useState<NotificationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await fetch('/notifications/inventory', {
                headers: { 'Accept': 'application/json' },
            });
            if (response.ok) {
                const json = await response.json();
                setData(json);
            }
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Refresh when dropdown opens
    useEffect(() => {
        if (open) fetchNotifications();
    }, [open, fetchNotifications]);

    const totalCount = data?.totalCount ?? 0;

    const typeConfig = {
        expired: {
            label: 'Expired',
            icon: AlertTriangle,
            color: 'text-red-500',
            bgColor: 'bg-red-50 dark:bg-red-950/30',
            borderColor: 'border-red-200 dark:border-red-900/50',
            badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
        },
        expiring_soon: {
            label: 'Expiring Soon',
            icon: Clock,
            color: 'text-amber-500',
            bgColor: 'bg-amber-50 dark:bg-amber-950/30',
            borderColor: 'border-amber-200 dark:border-amber-900/50',
            badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
        },
        out_of_stock: {
            label: 'Out of Stock',
            icon: PackageX,
            color: 'text-red-600',
            bgColor: 'bg-red-50 dark:bg-red-950/30',
            borderColor: 'border-red-200 dark:border-red-900/50',
            badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
        },
        low_stock: {
            label: 'Low Stock',
            icon: PackageMinus,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
            borderColor: 'border-yellow-200 dark:border-yellow-900/50',
            badgeClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400',
        },
    };

    const renderSection = (items: NotificationItem[], type: keyof typeof typeConfig) => {
        if (!items || items.length === 0) return null;
        const config = typeConfig[type];
        const Icon = config.icon;

        return (
            <div className="mb-3 last:mb-0">
                <div className="flex items-center gap-2 px-3 py-1.5">
                    <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        {config.label}
                    </span>
                    <span className={`ml-auto inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${config.badgeClass}`}>
                        {items.length}
                    </span>
                </div>
                <div className="space-y-1 px-2">
                    {items.map((item) => (
                        <div
                            key={`${type}-${item.id}`}
                            className={`rounded-lg border px-3 py-2 ${config.bgColor} ${config.borderColor}`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                                        {item.name}
                                    </p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        {item.brand} · {item.itemCode}
                                    </p>
                                </div>
                                <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
                                    {item.category}
                                </span>
                            </div>
                            <p className={`mt-1 text-xs font-medium ${config.color}`}>
                                {item.message}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="relative text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                    <Bell className="h-4 w-4" />
                    {totalCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                            {totalCount > 99 ? '99+' : totalCount}
                        </span>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[380px] p-0">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            Inventory Alerts
                        </h3>
                        {totalCount > 0 && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                {totalCount}
                            </Badge>
                        )}
                    </div>
                    <Link
                        href="/inventory-management"
                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        onClick={() => setOpen(false)}
                    >
                        View Inventory
                        <ExternalLink className="h-3 w-3" />
                    </Link>
                </div>

                {/* Content */}
                <ScrollArea className="max-h-[400px]">
                    <div className="p-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
                            </div>
                        ) : totalCount === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
                                <Bell className="mb-2 h-8 w-8" />
                                <p className="text-sm font-medium">All clear!</p>
                                <p className="text-xs">No inventory alerts at this time.</p>
                            </div>
                        ) : (
                            <>
                                {renderSection(data!.expired, 'expired')}
                                {renderSection(data!.expiringSoon, 'expiring_soon')}
                                {renderSection(data!.outOfStock, 'out_of_stock')}
                                {renderSection(data!.lowStock, 'low_stock')}
                            </>
                        )}
                    </div>
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
