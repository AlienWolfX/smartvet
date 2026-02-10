import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, DollarSign, FileText, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface PendingPayment {
    id: number;
    type: 'consultation' | 'vaccination';
    date: string;
    petName: string;
    ownerName: string;
    service: string;
    amount: string;
    status: string;
}

interface PaymentHistoryItem {
    id: number;
    date: string;
    petName: string;
    ownerName: string;
    amount: string;
    method: string;
    reference: string | null;
    status: string;
    recordedBy: string;
}

interface Props {
    pendingPayments: PendingPayment[];
    paymentHistory: PaymentHistoryItem[];
}

export default function Billing({ pendingPayments, paymentHistory }: Props) {
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    
    // Pagination states
    const [pendingPage, setPendingPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);
    const pendingPerPage = 5;
    const historyPerPage = 10;
    
    // Calculate paginated data
    const paginatedPending = pendingPayments.slice((pendingPage - 1) * pendingPerPage, pendingPage * pendingPerPage);
    const paginatedHistory = paymentHistory.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage);
    const totalPendingPages = Math.ceil(pendingPayments.length / pendingPerPage);
    const totalHistoryPages = Math.ceil(paymentHistory.length / historyPerPage);

    const openPaymentModal = (payment: PendingPayment) => {
        setSelectedPayment(payment);
        setPaymentMethod('');
        setReferenceNumber('');
        setNotes('');
        setPaymentModalOpen(true);
    };

    const handleProcessPayment = () => {
        if (!selectedPayment || !paymentMethod) return;

        setProcessing(true);
        router.post(`/billing/process/${selectedPayment.id}`, {
            payment_method: paymentMethod,
            reference_number: referenceNumber || null,
            notes: notes || null,
        }, {
            onSuccess: () => {
                setPaymentModalOpen(false);
                setSelectedPayment(null);
                setProcessing(false);
            },
            onError: () => {
                setProcessing(false);
            },
        });
    };

    const breadcrumbs = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Billing',
            href: '/billing',
        },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Billing & Payments" />
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Pending Payments
                            </CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{pendingPayments.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Awaiting payment
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Revenue (Today)
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₱0.00</div>
                            <p className="text-xs text-muted-foreground">
                                +0% from yesterday
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Recent Transactions
                            </CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{paymentHistory.length}</div>
                            <p className="text-xs text-muted-foreground">
                                In the last 30 days
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Payments</CardTitle>
                            <CardDescription>
                                Consultations and services awaiting payment.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Owner / Pet</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedPending.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                No pending payments found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedPending.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell>{payment.date}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{payment.ownerName}</span>
                                                        <span className="text-xs text-muted-foreground">{payment.petName}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{payment.service}</TableCell>
                                                <TableCell>₱{payment.amount}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                                        {payment.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" onClick={() => openPaymentModal(payment)}>
                                                        Process Payment
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            {totalPendingPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {((pendingPage - 1) * pendingPerPage) + 1} to {Math.min(pendingPage * pendingPerPage, pendingPayments.length)} of {pendingPayments.length} entries
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPendingPage(p => Math.max(1, p - 1))}
                                            disabled={pendingPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-sm">Page {pendingPage} of {totalPendingPages}</span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPendingPage(p => Math.min(totalPendingPages, p + 1))}
                                            disabled={pendingPage === totalPendingPages}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Payment History</CardTitle>
                            <CardDescription>
                                Recent transactions and payment records.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Owner / Pet</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Recorded By</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedHistory.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                                No payment history found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedHistory.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell>{payment.date}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{payment.ownerName}</span>
                                                        <span className="text-xs text-muted-foreground">{payment.petName}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>₱{payment.amount}</TableCell>
                                                <TableCell>{payment.method || '-'}</TableCell>
                                                <TableCell>{payment.reference || '-'}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        {payment.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{payment.recordedBy}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            {totalHistoryPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {((historyPage - 1) * historyPerPage) + 1} to {Math.min(historyPage * historyPerPage, paymentHistory.length)} of {paymentHistory.length} entries
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                            disabled={historyPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-sm">Page {historyPage} of {totalHistoryPages}</span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                                            disabled={historyPage === totalHistoryPages}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Payment Processing Modal */}
            <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Process Payment</DialogTitle>
                        <DialogDescription>
                            Complete the payment for {selectedPayment?.petName} - {selectedPayment?.service}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Amount Due</Label>
                            <div className="text-2xl font-bold text-primary">
                                ₱{selectedPayment?.amount}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="payment-method">Payment Method *</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger id="payment-method">
                                    <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="gcash">GCash</SelectItem>
                                    <SelectItem value="maya">Maya</SelectItem>
                                    <SelectItem value="credit_card">Credit Card</SelectItem>
                                    <SelectItem value="debit_card">Debit Card</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {paymentMethod && paymentMethod !== 'cash' && (
                            <div className="grid gap-2">
                                <Label htmlFor="reference-number">Reference Number</Label>
                                <Input
                                    id="reference-number"
                                    placeholder="Transaction or receipt number"
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                />
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                placeholder="Additional notes (optional)"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setPaymentModalOpen(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleProcessPayment}
                            disabled={!paymentMethod || processing}
                        >
                            {processing ? 'Processing...' : 'Confirm Payment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
