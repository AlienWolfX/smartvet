import { useState, useEffect, useCallback } from 'react';
import { Bell, AlertTriangle, Clock, PackageX, PackageMinus, ExternalLink, Check, CheckCheck, X } from 'lucide-react';
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
    dismissed?: boolean;
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
    const [dismissing, setDismissing] = useState<string | null>(null);
    const [showDismissed, setShowDismissed] = useState(false);

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

    const dismissNotification = async (itemId: number, type: string) => {
        const key = `${itemId}:${type}`;
        setDismissing(key);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch('/notifications/dismiss', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({ inventory_item_id: itemId, notification_type: type }),
            });
            if (response.ok) {
                await fetchNotifications();
            }
        } catch {
            // silently fail
        } finally {
            setDismissing(null);
        }
    };

    const dismissAllNotifications = async () => {
        setDismissing('all');
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch('/notifications/dismiss-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
            });
            if (response.ok) {
                await fetchNotifications();
            }
        } catch {
            // silently fail
        } finally {
            setDismissing(null);
        }
    };

    const totalCount = data?.totalCount ?? 0;
    const totalAllCount = (data?.expired?.length ?? 0) + (data?.expiringSoon?.length ?? 0) + (data?.outOfStock?.length ?? 0) + (data?.lowStock?.length ?? 0);
    const hasDismissed = totalAllCount > totalCount;

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
        const visibleItems = showDismissed ? items : items.filter(i => !i.dismissed);
        if (!visibleItems || visibleItems.length === 0) return null;
        const config = typeConfig[type];
        const Icon = config.icon;
        const activeCount = items.filter(i => !i.dismissed).length;

        return (
            <div className="mb-3 last:mb-0">
                <div className="flex items-center gap-2 px-3 py-1.5">
                    <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        {config.label}
                    </span>
                    <span className={`ml-auto inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${config.badgeClass}`}>
                        {activeCount}
                    </span>
                </div>
                <div className="space-y-1 px-2">
                    {visibleItems.map((item) => (
                        <div
                            key={`${type}-${item.id}`}
                            className={`rounded-lg border px-3 py-2 ${config.bgColor} ${config.borderColor} ${item.dismissed ? 'opacity-50' : ''}`}
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
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
                                        {item.category}
                                    </span>
                                    {!item.dismissed && (
                                        <button
                                            onClick={() => dismissNotification(item.id, item.type)}
                                            disabled={dismissing === `${item.id}:${item.type}`}
                                            className="ml-1 rounded-full p-0.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 transition-colors"
                                            title="Mark as read"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                    {item.dismissed && (
                                        <span className="ml-1 text-green-500" title="Read">
                                            <Check className="h-3 w-3" />
                                        </span>
                                    )}
                                </div>
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

                {/* Actions bar */}
                {totalAllCount > 0 && (
                    <div className="flex items-center justify-between border-b px-4 py-2">
                        {hasDismissed ? (
                            <button
                                onClick={() => setShowDismissed(!showDismissed)}
                                className="text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
                            >
                                {showDismissed ? 'Hide read' : 'Show read'}
                            </button>
                        ) : (
                            <span />
                        )}
                        {totalCount > 0 && (
                            <button
                                onClick={dismissAllNotifications}
                                disabled={dismissing === 'all'}
                                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 transition-colors"
                            >
                                <CheckCheck className="h-3 w-3" />
                                {dismissing === 'all' ? 'Marking...' : 'Mark all as read'}
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <ScrollArea className="max-h-[400px]">
                    <div className="p-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
                            </div>
                        ) : totalAllCount === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
                                <Bell className="mb-2 h-8 w-8" />
                                <p className="text-sm font-medium">All clear!</p>
                                <p className="text-xs">No inventory alerts at this time.</p>
                            </div>
                        ) : totalCount === 0 && !showDismissed ? (
                            <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
                                <CheckCheck className="mb-2 h-8 w-8 text-green-500" />
                                <p className="text-sm font-medium">All caught up!</p>
                                <p className="text-xs">All notifications have been read.</p>
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
