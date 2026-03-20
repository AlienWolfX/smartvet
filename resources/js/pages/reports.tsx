import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { RevenueChart, ServiceDonutChart } from '@/components/ui/charts';
import AdminLayout from '@/layouts/admin-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Download,
    DollarSign,
    Activity,
    FileText,
    PieChart,
    Target,
    Loader2
} from 'lucide-react';
import { useState } from 'react';

interface RevenueData {
    period: string;
    revenue: number;
    expenses: number;
    netProfit: number;
}

interface ServiceData {
    service: string;
    revenue: number;
    count: number;
    growth: number;
}

interface Totals {
    totalRevenue: number;
    totalExpenses: number;
    totalProfit: number;
    profitMargin: number;
}

interface Props {
    revenueData: RevenueData[];
    serviceData: ServiceData[];
    totals: Totals;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard.url(),
    },
    {
        title: 'Reports & Analytics',
        href: '/reports',
    },
];

export default function Reports({ revenueData, serviceData, totals }: Props) {
    // Report modal states
    const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState<string | null>(null);

    // Filter states - now using date from/to only
    const [financialFilters, setFinancialFilters] = useState({
        dateFrom: '',
        dateTo: '',
    });
    const [serviceFilters, setServiceFilters] = useState({
        dateFrom: '',
        dateTo: '',
    });

    const handleExportFinancial = async () => {
        setIsExporting('financial');
        try {
            const params = new URLSearchParams();
            if (financialFilters.dateFrom) params.append('date_from', financialFilters.dateFrom);
            if (financialFilters.dateTo) params.append('date_to', financialFilters.dateTo);

            window.location.href = `/reports/export/financial?${params.toString()}`;
            setIsFinancialModalOpen(false);
        } finally {
            setTimeout(() => setIsExporting(null), 1500);
        }
    };

    const handleExportService = async () => {
        setIsExporting('service');
        try {
            const params = new URLSearchParams();
            if (serviceFilters.dateFrom) params.append('date_from', serviceFilters.dateFrom);
            if (serviceFilters.dateTo) params.append('date_to', serviceFilters.dateTo);

            window.location.href = `/reports/export/service?${params.toString()}`;
            setIsServiceModalOpen(false);
        } finally {
            setTimeout(() => setIsExporting(null), 1500);
        }
    };

    const formatPeso = (value: number) =>
        `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

    // Find best month from revenue data
    const bestMonth = revenueData.length > 0
        ? revenueData.reduce((max, item) => item.revenue > max.revenue ? item : max, revenueData[0])
        : null;

    const avgRevenue = revenueData.length > 0
        ? revenueData.reduce((sum, item) => sum + item.revenue, 0) / revenueData.length
        : 0;

    return (
        <AdminLayout
            breadcrumbs={breadcrumbs}
            title="Reports & Analytics"
            description="Comprehensive business insights, financial reports, and operational analytics for your veterinary clinic."
        >
            <Head title="Reports & Analytics" />

            {/* Row 1: Actions + Key Metrics */}
            <div className="grid gap-3 grid-cols-1 md:grid-cols-5">
                {/* Report Actions */}
                <Card className="md:col-span-2 border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-gray-600" />
                            Report Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2 md:grid-cols-2">
                            <Button
                                variant="outline"
                                className="h-auto p-3 flex flex-col items-start gap-1 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
                                onClick={() => setIsFinancialModalOpen(true)}
                            >
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-emerald-600" />
                                    <span className="font-medium text-sm">Financial Report</span>
                                </div>
                                <span className="text-xs text-muted-foreground text-left">
                                    Revenue, expenses &amp; profit
                                </span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-auto p-3 flex flex-col items-start gap-1 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors"
                                onClick={() => setIsServiceModalOpen(true)}
                            >
                                <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-purple-600" />
                                    <span className="font-medium text-sm">Service Report</span>
                                </div>
                                <span className="text-xs text-muted-foreground text-left">
                                    Service performance stats
                                </span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Key Metrics */}
                <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{formatPeso(totals.totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">
                            <TrendingUp className="inline h-3 w-3 mr-1" />
                            Last 6 months
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                        <Target className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{formatPeso(totals.totalProfit)}</div>
                        <p className="text-xs text-muted-foreground">
                            {totals.profitMargin.toFixed(1)}% profit margin
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatPeso(totals.totalExpenses)}</div>
                        <p className="text-xs text-muted-foreground">
                            Estimated operating costs
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Charts */}
            <div className="grid gap-3 lg:grid-cols-2">
                {/* Revenue Trends */}
                <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <BarChart3 className="h-4 w-4 text-blue-600" />
                            Revenue &amp; Profit Analysis
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Monthly revenue vs profit comparison
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RevenueChart data={revenueData} height={200} />
                        <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t">
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Avg Monthly</p>
                                <p className="font-semibold text-sm">{formatPeso(avgRevenue)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Profit Margin</p>
                                <p className="font-semibold text-sm text-emerald-600">{totals.profitMargin.toFixed(1)}%</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Best Month</p>
                                <p className="font-semibold text-sm">{bestMonth?.period || 'N/A'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Service Performance */}
                <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <PieChart className="h-4 w-4 text-purple-600" />
                            Service Performance
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Revenue distribution and growth by service type
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ServiceDonutChart data={serviceData} />
                    </CardContent>
                </Card>
            </div>

            {/* Financial Report Modal */}
            <Dialog open={isFinancialModalOpen} onOpenChange={setIsFinancialModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-emerald-600" />
                            Export Financial Report
                        </DialogTitle>
                        <DialogDescription>
                            Select date range to export detailed financial data
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="financial-date-from">Date From</Label>
                            <Input
                                id="financial-date-from"
                                type="date"
                                value={financialFilters.dateFrom}
                                onChange={(e) => setFinancialFilters({...financialFilters, dateFrom: e.target.value})}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="financial-date-to">Date To</Label>
                            <Input
                                id="financial-date-to"
                                type="date"
                                value={financialFilters.dateTo}
                                onChange={(e) => setFinancialFilters({...financialFilters, dateTo: e.target.value})}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFinancialModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleExportFinancial} disabled={isExporting === 'financial'}>
                            {isExporting === 'financial' ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export Report
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Service Report Modal */}
            <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-purple-600" />
                            Export Service Report
                        </DialogTitle>
                        <DialogDescription>
                            Select date range to export service performance data
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="service-date-from">Date From</Label>
                            <Input
                                id="service-date-from"
                                type="date"
                                value={serviceFilters.dateFrom}
                                onChange={(e) => setServiceFilters({...serviceFilters, dateFrom: e.target.value})}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="service-date-to">Date To</Label>
                            <Input
                                id="service-date-to"
                                type="date"
                                value={serviceFilters.dateTo}
                                onChange={(e) => setServiceFilters({...serviceFilters, dateTo: e.target.value})}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsServiceModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleExportService} disabled={isExporting === 'service'}>
                            {isExporting === 'service' ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export Report
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
