import AdminLayout from '@/layouts/admin-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { type SharedData } from '@/types';
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
import { CreditCard, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface PaymentItem {
    service_type: string;
    description: string;
    amount: number;
}

interface PendingPayment {
    id: number;
    type: 'consultation' | 'vaccination';
    date: string;
    petName: string;
    ownerName: string;
    service: string;
    amount: number;
    status: string;
    items: PaymentItem[];
}

interface PaymentHistoryItem {
    id: number;
    date: string;
    petName: string;
    ownerName: string;
    amount: number;
    deductionAmount: number;
    deductionReason: string | null;
    finalAmount: number;
    method: string;
    reference: string | null;
    status: string;
    recordedBy: string;
    items: PaymentItem[];
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
    const [deductionReason, setDeductionReason] = useState('');
    const [deductionAmount, setDeductionAmount] = useState(0);
    const [deductionType, setDeductionType] = useState<'pesos' | 'percentage' | ''>('');
    const [modalErrors, setModalErrors] = useState<{[key: string]: string}>({});

    const [billingSlipModalOpen, setBillingSlipModalOpen] = useState(false);
    const [selectedHistoryPayment, setSelectedHistoryPayment] = useState<PaymentHistoryItem | null>(null);

    const { auth } = usePage<SharedData>().props;
    const clinicName = (auth.user as { clinic_name?: string })?.clinic_name || 'SmartVet';

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const paymentIdParam = searchParams.get('payment_id');
        if (!paymentIdParam) {
            return;
        }

        const paymentId = Number(paymentIdParam);
        if (Number.isNaN(paymentId)) {
            return;
        }

        const payment = paymentHistory.find((item) => item.id === paymentId);
        if (payment) {
            setSelectedHistoryPayment(payment);
            setBillingSlipModalOpen(true);
        }
    }, [paymentHistory]);

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
        setDeductionReason('');
        setDeductionAmount(0);
        setDeductionType('');
        setModalErrors({});
        setPaymentModalOpen(true);
    };

    const openBillingSlipModal = (payment: PaymentHistoryItem) => {
        setSelectedHistoryPayment(payment);
        setBillingSlipModalOpen(true);
    };

    // Helper to check if deduction is valid
    const isDeductionValid = () => {
        if (deductionAmount > 0) {
            return deductionType === 'pesos' || deductionType === 'percentage';
        }
        return true; // Valid if no deduction amount
    };

    const handleProcessPayment = () => {
        if (!selectedPayment || !paymentMethod) return;

        // Frontend validation - strict check for deduction type
        const errors: {[key: string]: string} = {};
        const hasDeductionAmount = deductionAmount > 0;
        const hasDeductionType = deductionType === 'pesos' || deductionType === 'percentage';

        if (hasDeductionAmount && !hasDeductionType) {
            errors['deduction_type'] = 'Please select a deduction type (Pesos or Percentage) when applying a deduction.';
        }

        if (Object.keys(errors).length > 0) {
            setModalErrors(errors);
            return;
        }

        setModalErrors({});
        setProcessing(true);

        // Calculate deduction only if BOTH amount and type are valid
        let deductionValue = 0;
        let deductionTypeToSend = null;

        if (hasDeductionAmount && hasDeductionType) {
            deductionTypeToSend = deductionType;
            if (deductionType === 'percentage') {
                deductionValue = (Number(selectedPayment.amount) * deductionAmount) / 100;
            } else {
                deductionValue = deductionAmount;
            }
        }

        const finalAmount = Math.max(
            0,
            Number(selectedPayment.amount) - deductionValue
        );

        router.post(`/billing/process/${selectedPayment.id}`, {
            payment_method: paymentMethod,
            reference_number: referenceNumber || null,
            notes: notes || null,
            deduction_amount: deductionValue > 0 ? deductionValue : null,
            deduction_reason: deductionReason || null,
            deduction_type: deductionTypeToSend,
            final_amount: finalAmount,
        }, {
            onSuccess: () => {
                setPaymentModalOpen(false);
                setSelectedPayment(null);
                setProcessing(false);
                setModalErrors({});
            },
            onError: (errors: any) => {
                setModalErrors(errors);
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
            title: 'Billing & Payments',
            href: '/billing',
        },
    ];

    return (
        <AdminLayout title="Billing & Payments" description="Manage invoices, process payments, and track financial transactions." breadcrumbs={breadcrumbs}>
            <Head title="Billing & Payments" />
            <div className="flex flex-1 flex-col gap-5 p-5 pt-0 lg:p-6 lg:pt-0 overflow-y-auto h-[calc(100vh-160px)]">
                <div className="grid auto-rows-min gap-5 md:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2.5">
                            <CardTitle className="text-base font-semibold">
                                Pending Payments
                            </CardTitle>
                            <Clock className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">{pendingPayments.length}</div>
                            <p className="text-sm text-muted-foreground">
                                Awaiting payment
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2.5">
                            <CardTitle className="text-base font-semibold">
                                Recent Transactions
                            </CardTitle>
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">{paymentHistory.length}</div>
                            <p className="text-sm text-muted-foreground">
                                In the last 30 days
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col gap-5">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">Pending Payments</CardTitle>
                            <CardDescription>
                                Consultations and services awaiting payment.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-auto max-h-[60vh] text-base">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background z-10">
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
                            </div>
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
                            <CardTitle className="text-2xl">Payment History</CardTitle>
                            <CardDescription>
                                Recent transactions and payment records.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-auto max-h-[60vh] text-base">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background z-10">
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Owner / Pet</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Recorded By</TableHead>
                                        <TableHead className="text-right">Billing</TableHead>
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
                                                <TableCell>
                                                    {Number(payment.finalAmount) < Number(payment.amount) ? (
                                                        <div className="flex flex-col gap-1">
                                                            <span>₱{Number(payment.finalAmount).toFixed(2)}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                Deducted: ₱{(Number(payment.amount) - Number(payment.finalAmount)).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <>₱{Number(payment.amount).toFixed(2)}</>
                                                    )}
                                                </TableCell>
                                                <TableCell>{payment.method || '-'}</TableCell>
                                                <TableCell>{payment.reference || '-'}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        {payment.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{payment.recordedBy}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" variant="outline" onClick={() => openBillingSlipModal(payment)}>
                                                        View Billing Slip
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            </div>
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
                <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Process Payment</DialogTitle>
                        <DialogDescription>
                            Complete the payment for {selectedPayment?.petName} - {selectedPayment?.service}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-y-auto flex-1">
                        <div className="grid gap-5 py-4 px-6">
                        {Object.keys(modalErrors).length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm font-semibold text-red-800 mb-2">Please fix the following errors:</p>
                                <ul className="space-y-1">
                                    {Object.entries(modalErrors).map(([key, message]) => (
                                        <li key={key} className="text-sm text-red-700">• {message}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="border-t pt-3">
                            <div className="text-sm font-semibold mb-3">Adjustments</div>
                            <div className="grid gap-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="deduction-reason">Deduction Reason (e.g., 2 tablets not used)</Label>
                                    <Input
                                        id="deduction-reason"
                                        placeholder="Describe what is being deducted (optional)"
                                        value={deductionReason}
                                        onChange={(e) => setDeductionReason(e.target.value)}
                                        className="h-11"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="deduction-type">Deduction Type</Label>
                                    <Select value={deductionType} onValueChange={(value) => setDeductionType(value as 'pesos' | 'percentage')}>
                                        <SelectTrigger id="deduction-type" className={`h-11 ${modalErrors['deduction_type'] ? 'border-red-500' : ''}`}>
                                            <SelectValue placeholder="Select deduction type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pesos">Pesos (₱)</SelectItem>
                                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {modalErrors['deduction_type'] && (
                                        <p className="text-sm text-red-600">{modalErrors['deduction_type']}</p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="deduction-amount">Deduction Amount {deductionType === 'percentage' ? '(%)' : '(₱)'}</Label>
                                    <Input
                                        id="deduction-amount"
                                        type="number"
                                        placeholder={deductionType === 'percentage' ? "Enter percentage (0-100)" : "Enter deduction amount (optional)"}
                                        value={deductionAmount || ''}
                                        onChange={(e) => {
                                            const value = parseFloat(e.target.value) || 0;
                                            if (deductionType === 'percentage') {
                                                setDeductionAmount(Math.min(Math.max(0, value), 100));
                                            } else {
                                                setDeductionAmount(Math.max(0, value));
                                            }
                                        }}
                                        className="h-11"
                                        min="0"
                                        max={deductionType === 'percentage' ? "100" : undefined}
                                        step={deductionType === 'percentage' ? "0.1" : "1"}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="border-t pt-3 mt-3">
                            <div className="grid gap-2">
                                <div className="flex justify-between text-sm">
                                    <span>Original Amount:</span>
                                    <span>₱{Number(selectedPayment?.amount || 0).toFixed(2)}</span>
                                </div>
                                {deductionAmount > 0 && deductionType && (
                                    <div className="flex justify-between text-sm text-red-600">
                                        <span>Deduction ({deductionType === 'percentage' ? `${deductionAmount}%` : 'Pesos'}):</span>
                                        <span>-₱{(
                                            deductionType === 'percentage'
                                                ? (Number(selectedPayment?.amount || 0) * deductionAmount) / 100
                                                : deductionAmount
                                        ).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold border-t pt-2">
                                    <span>Final Amount:</span>
                                    <span className="text-primary">₱{(() => {
                                        const original = Number(selectedPayment?.amount || 0);
                                        let deductionValue = 0;
                                        if (deductionAmount > 0 && deductionType) {
                                            deductionValue = deductionType === 'percentage'
                                                ? (original * deductionAmount) / 100
                                                : deductionAmount;
                                        }
                                        return Math.max(0, original - deductionValue).toFixed(2);
                                    })()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="payment-method">Payment Method *</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger id="payment-method" className="h-11">
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
                                    className="h-11"
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
                                className="min-h-24"
                            />
                        </div>
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
                            disabled={!paymentMethod || processing || !isDeductionValid()}
                            title={!isDeductionValid() ? 'Please select a deduction type (Pesos or Percentage)' : ''}
                        >
                            {processing ? 'Processing...' : 'Confirm Payment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={billingSlipModalOpen} onOpenChange={setBillingSlipModalOpen}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
                    <div className="billing-slip-paper flex flex-col h-full">
                        <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-center">{clinicName}</DialogTitle>
                        <DialogDescription>
                            Billing Slip for {selectedHistoryPayment?.petName} - {selectedHistoryPayment?.date}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-y-auto flex-1 px-6">
                        <div className="grid gap-3 py-4">
                        <div className="text-sm">
                            <p><strong>Pet:</strong> {selectedHistoryPayment?.petName}</p>
                            <p><strong>Owner:</strong> {selectedHistoryPayment?.ownerName}</p>
                            <p><strong>Paid At:</strong> {selectedHistoryPayment?.date}</p>
                            <p><strong>Method:</strong> {selectedHistoryPayment?.method || '-'} {selectedHistoryPayment?.reference ? ` (ref: ${selectedHistoryPayment.reference})` : ''}</p>
                        </div>

                        <div className="border rounded-md p-3">
                            <div className="text-sm font-semibold mb-2">Items / Services</div>
                            <div className="space-y-1">
                                {selectedHistoryPayment?.items?.map((item) => {
                                    const itemAmount = Number(item.amount);
                                    const displayAmount = Number.isNaN(itemAmount) ? '0.00' : itemAmount.toFixed(2);
                                    return (
                                        <div key={`${item.service_type}-${item.description}`} className="flex justify-between text-sm">
                                            <span>{item.description}</span>
                                            <span>₱{displayAmount}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="border-t pt-3">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Original Amount:</span>
                                    <span className="font-semibold">₱{selectedHistoryPayment ? Number(selectedHistoryPayment.amount).toFixed(2) : '0.00'}</span>
                                </div>
                                {selectedHistoryPayment?.deductionAmount && selectedHistoryPayment.deductionAmount > 0 && (
                                    <div className="flex justify-between text-sm text-red-600">
                                        <span>Deduction:</span>
                                        <span>-₱{Number(selectedHistoryPayment.deductionAmount).toFixed(2)}</span>
                                    </div>
                                )}
                                {selectedHistoryPayment?.deductionReason && (
                                    <div className="text-sm text-neutral-600">
                                        <span className="font-medium">Deduction Reason:</span> {selectedHistoryPayment.deductionReason}
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold border-t pt-2">
                                    <span>Final Amount:</span>
                                    <span>₱{Number(selectedHistoryPayment?.finalAmount || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                    <DialogFooter className="billing-slip-footer flex gap-2 justify-end">
                        <Button onClick={() => setBillingSlipModalOpen(false)}>Close</Button>
                    </DialogFooter>
                </div>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
