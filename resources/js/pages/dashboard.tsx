import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import AdminLayout from '@/layouts/admin-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowUpRight,
    CreditCard,
    PawPrint,
    PiggyBank,
    ShoppingBag,
    Wallet,
} from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { useState } from 'react';

type Trend = 'up' | 'down';

interface MetricCard {
    title: string;
    value: string;
    change: string;
    trend: Trend;
    meta: string;
    icon: LucideIcon;
    accent: string;
}

const formatPeso = (value: number) =>
    `₱${value.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;

interface RecentTransaction {
    id: string;
    client: string;
    pet: string;
    service: string;
    amount: number;
    status: 'Cleared' | 'Pending' | 'Flagged';
}

interface ServiceHighlight {
    name: string;
    cases: string;
    revenue: number;
    trend: string;
    color: string;
}

interface Stats {
    dailyGross: {
        value: number;
        change: number;
        changeText: string;
        trend: 'up' | 'down';
        meta: string;
    };
    monthlyRevenue: {
        value: number;
        change: number;
        changeText: string;
        trend: 'up' | 'down';
        meta: string;
    };
    pendingPayments: {
        value: number;
        count: number;
        changeText: string;
        trend: 'up' | 'down';
        meta: string;
    };
    patientsToday: {
        value: number;
        change: number;
        changeText: string;
        trend: 'up' | 'down';
        meta: string;
    };
    totalPets: number;
    totalOwners: number;
    activePets: number;
    lowStockCount: number;
    upcomingVaccinations: number;
}

interface DashboardProps {
    stats: Stats;
    recentTransactions: RecentTransaction[];
    serviceHighlights: ServiceHighlight[];
}

const statusTone: Record<RecentTransaction['status'], string> = {
    Cleared:
        'border-transparent bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200',
    Pending:
        'border-transparent bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200',
    Flagged:
        'border-transparent bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200',
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard({ stats, recentTransactions, serviceHighlights }: DashboardProps) {
    const [page, setPage] = useState(0);
    const pageSize = 3;
    const transactionCount = recentTransactions?.length || 0;
    const totalPages = Math.max(Math.ceil(transactionCount / pageSize), 1);
    const currentPage = Math.min(page, totalPages - 1);
    const paginatedTransactions = (recentTransactions || []).slice(
        currentPage * pageSize,
        currentPage * pageSize + pageSize,
    );
    const canPrev = currentPage > 0;
    const canNext = currentPage < totalPages - 1;
    const handlePrevPage = () => setPage((prev) => Math.max(prev - 1, 0));
    const handleNextPage = () =>
        setPage((prev) => Math.min(prev + 1, totalPages - 1));

    const metricCards: MetricCard[] = [
        {
            title: 'Daily Revenue',
            value: formatPeso(stats?.dailyGross?.value || 0),
            change: stats?.dailyGross?.changeText || 'No data',
            trend: stats?.dailyGross?.trend || 'up',
            meta: stats?.dailyGross?.meta || '0 invoices issued',
            icon: Wallet,
            accent: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200',
        },
        {
            title: 'Monthly Revenue',
            value: formatPeso(stats?.monthlyRevenue?.value || 0),
            change: stats?.monthlyRevenue?.changeText || 'No data',
            trend: stats?.monthlyRevenue?.trend || 'up',
            meta: stats?.monthlyRevenue?.meta || 'This month total',
            icon: CreditCard,
            accent: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200',
        },
        {
            title: 'Pending Payments',
            value: formatPeso(stats?.pendingPayments?.value || 0),
            change: stats?.pendingPayments?.changeText || '0 pending',
            trend: stats?.pendingPayments?.trend || 'down',
            meta: stats?.pendingPayments?.meta || 'Awaiting payment',
            icon: PiggyBank,
            accent: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200',
        },
        {
            title: 'Patients Today',
            value: `${stats?.patientsToday?.value || 0} patients`,
            change: stats?.patientsToday?.changeText || 'No visits',
            trend: stats?.patientsToday?.trend || 'up',
            meta: stats?.patientsToday?.meta || '0 total pets',
            icon: PawPrint,
            accent: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200',
        },
    ];

    const services = serviceHighlights || [];
    const totalServiceRevenue = services.reduce(
        (sum, service) => sum + (service.revenue || 0),
        0,
    );
    const safeServiceTotal = totalServiceRevenue || 1;
    const serviceSegments = services.map((service, index) => {
        const previousValue = services
            .slice(0, index)
            .reduce((sum, item) => sum + (item.revenue || 0), 0);
        return {
            ...service,
            percentage: Math.round((service.revenue / safeServiceTotal) * 100),
            startAngle: (previousValue / safeServiceTotal) * 360,
            endAngle:
                ((previousValue + service.revenue) / safeServiceTotal) * 360,
        };
    });
    const donutGradient = serviceSegments.length
        ? serviceSegments
              .map(
                  (segment) =>
                      `${segment.color} ${segment.startAngle}deg ${segment.endAngle}deg`,
              )
              .join(', ')
        : '#d4d4d8 0deg 360deg';

    return (
        <AdminLayout
            breadcrumbs={breadcrumbs}
            title="Clinic Dashboard"
            description="Revenue, patients, and service overview for SmartVet clinic."
        >
            <Head title="Dashboard" />
            <div className="flex flex-col gap-3 h-full">
            <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
                {metricCards.map((metric) => (
                    <Card
                        key={metric.title}
                        className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900"
                    >
                        <CardHeader className="flex flex-row items-start justify-between pb-2 pt-3 px-4">
                            <div>
                                <CardTitle className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                                    {metric.title}
                                </CardTitle>
                                <CardDescription className="text-xs">{metric.meta}</CardDescription>
                            </div>
                            <div className={cn('rounded-xl p-2', metric.accent)}>
                                <metric.icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-3">
                            <div className="text-2xl font-semibold leading-none tracking-tight">
                                {metric.value}
                            </div>
                            <div
                                className={cn(
                                    'mt-1 flex items-center text-sm font-semibold',
                                    metric.trend === 'up'
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-rose-600 dark:text-rose-400',
                                )}
                            >
                                {metric.trend === 'up' ? (
                                    <ArrowUpRight className="mr-1 h-4 w-4" />
                                ) : (
                                    <ArrowDownRight className="mr-1 h-4 w-4" />
                                )}
                                {metric.change}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex-1 min-h-0 grid gap-3 xl:grid-cols-3">
                <Card className="border border-white/70 bg-white/95 shadow-lg dark:border-white/5 dark:bg-neutral-900 xl:col-span-2 flex flex-col overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-4">
                        <div>
                            <CardTitle className="text-base">Recent Transactions</CardTitle>
                            <CardDescription className="text-xs">Latest payment transactions from the clinic.</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs">
                            {transactionCount} records
                        </Badge>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto space-y-2 px-4 pb-2">
                        {paginatedTransactions.length > 0 ? (
                            paginatedTransactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-200/70 px-3 py-2.5 dark:border-neutral-800/80"
                                >
                                    <div className="min-w-[160px]">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                            {tx.id}
                                        </p>
                                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                            {tx.client}
                                        </p>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                            {tx.pet}
                                        </p>
                                        <p className="text-xs text-neutral-400">{tx.service}</p>
                                    </div>
                                    <div className="flex flex-1 items-center gap-3">
                                        <Badge variant="outline" className={statusTone[tx.status]}>
                                            {tx.status}
                                        </Badge>
                                        <p className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                                            {formatPeso(tx.amount)}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="ml-auto">
                                        View details
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-neutral-500">
                                No recent transactions found.
                            </div>
                        )}
                    </CardContent>
                    {transactionCount > 0 && (
                        <CardFooter className="flex items-center justify-between border-t border-neutral-100 px-4 pt-4 dark:border-neutral-800">
                            <span className="text-xs text-neutral-500">
                                Page {currentPage + 1} of {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrevPage}
                                    disabled={!canPrev}
                                >
                                    Prev
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleNextPage}
                                    disabled={!canNext}
                                >
                                    Next
                                </Button>
                            </div>
                        </CardFooter>
                    )}
                </Card>
                <Card className="border border-white/70 bg-white/95 shadow-lg dark:border-white/5 dark:bg-neutral-900 flex flex-col overflow-hidden">
                    <CardHeader className="flex flex-col gap-1 pb-2 pt-3 px-4">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
                            <ShoppingBag className="h-3.5 w-3.5" /> Service Mix
                        </div>
                        <CardTitle className="text-base">Services Breakdown</CardTitle>
                        <CardDescription className="text-xs">Revenue distribution by service type this month.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto px-4 pb-3">
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col items-center justify-center">
                                <div className="relative h-36 w-36">
                                    <div
                                        className="h-full w-full rounded-full"
                                        style={{ background: `conic-gradient(${donutGradient})` }}
                                    />
                                    <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white text-center dark:bg-neutral-950">
                                        <p className="text-[10px] uppercase tracking-wide text-neutral-500">
                                            Total
                                        </p>
                                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                                            {formatPeso(totalServiceRevenue)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {serviceSegments.length > 0 ? (
                                    serviceSegments.map((segment) => (
                                        <div key={segment.name} className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="inline-flex size-3 rounded-full"
                                                    style={{ backgroundColor: segment.color }}
                                                ></span>
                                                <div>
                                                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                                        {segment.name}
                                                    </p>
                                                    <p className="text-xs text-neutral-500">{segment.cases}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                                                    {formatPeso(segment.revenue)}
                                                </p>
                                                <p className="text-xs text-neutral-500">
                                                    {segment.percentage}% • {segment.trend}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-4 text-center text-neutral-500">
                                        No service data available.
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            </div>
        </AdminLayout>
    );
}
