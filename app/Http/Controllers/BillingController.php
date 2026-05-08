<?php

namespace App\Http\Controllers;

use App\Models\Consultation;
use App\Models\PetPayment;
use App\Models\Vaccination;
use App\Http\Traits\ScopesToTenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BillingController extends Controller
{
    use ScopesToTenant;
    public function index()
    {
        // Fetch all pending payments from PetPayment table (both consultations and vaccinations)
        $pendingPayments = $this->scopePetPaymentToUser(PetPayment::with(['pet.owner', 'consultation', 'vaccination', 'items'])
            ->where('status', 'pending'))
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($payment) {
                $isVaccination = $payment->vaccination_id !== null;
                $isConsultation = $payment->consultation_id !== null;
                $hasInventorySale = $payment->items->contains(fn ($item) => $item->service_type === 'inventory_item');

                return [
                    'id' => $payment->id,
                    'type' => $isVaccination ? 'vaccination' : ($isConsultation ? 'consultation' : 'inventory_sale'),
                    'date' => $payment->created_at->format('F j, Y h:i A'),
                    'createdAt' => $payment->created_at->toDateTimeString(),
                    'petName' => optional($payment->pet)->name ?? ($payment->customer_name ? 'Walk-in' : 'Unknown'),
                    'ownerName' => optional(optional($payment->pet)->owner)->name ?? ($payment->customer_name ?? 'Walk-in Customer'),
                    'service' => $isVaccination
                        ? 'Vaccination: ' . ($payment->vaccination->vaccine_name ?? 'Unknown')
                        : ($isConsultation
                            ? ucfirst(str_replace('-', ' ', $payment->consultation->consultation_type ?? 'Consultation'))
                            : ($hasInventorySale ? 'Inventory Sale' : 'Service')),
                    'amount' => $payment->total_amount,
                    'status' => $payment->status,
                    'items' => ($payment->items->map(function ($item) {
                        return [
                            'service_type' => $item->service_type,
                            'description' => $item->description,
                            'amount' => $item->amount,
                        ];
                    })->toArray() ?: [
                        [
                            'service_type' => $isVaccination ? 'vaccination' : 'consultation',
                            'description' => $isVaccination
                                ? 'Vaccination: ' . ($payment->vaccination->vaccine_name ?? 'Unknown')
                                : ($isConsultation
                                    ? ucfirst(str_replace('-', ' ', $payment->consultation->consultation_type ?? 'Consultation'))
                                    : 'Service'),
                            'amount' => $payment->total_amount,
                        ],
                    ]),
                ];
            });

        $paymentHistory = $this->scopePetPaymentToUser(PetPayment::with(['pet.owner', 'recordedBy', 'items'])
            ->where('status', 'paid'))
            ->orderBy('paid_at', 'desc')
            ->get()
            ->map(function ($payment) {
                $hasInventorySale = $payment->items->contains(fn($item) => $item->service_type === 'inventory_item');

                return [
                    'id' => $payment->id,
                    'date' => optional($payment->paid_at)->format('F j, Y h:i A'),
                    'paidAt' => optional($payment->paid_at)->toDateTimeString(),
                    'petName' => optional($payment->pet)->name ?? ($payment->customer_name ? 'Walk-in' : 'Unknown'),
                    'ownerName' => optional(optional($payment->pet)->owner)->name ?? ($payment->customer_name ?? 'Walk-in Customer'),
                    'amount' => $payment->total_amount,
                    'deductionAmount' => $payment->deduction_amount ?? 0,
                    'deductionReason' => $payment->deduction_reason,
                    'finalAmount' => $payment->final_amount ?? $payment->total_amount,
                    'method' => $payment->payment_method
                        ? ucfirst($payment->payment_method)
                        : null,
                    'reference' => $payment->reference_number,
                    'status' => $payment->status,
                    'recordedBy' => $payment->recordedBy->name ?? 'System',
                    'service' => $payment->vaccination_id
                        ? 'Vaccination: ' . ($payment->vaccination->vaccine_name ?? 'Unknown')
                        : ($payment->consultation_id
                            ? ucfirst(str_replace('-', ' ', $payment->consultation->consultation_type ?? 'Consultation'))
                            : ($hasInventorySale ? 'Inventory Sale' : 'Service')),
                    'items' => ($payment->items->map(function ($item) {
                        return [
                            'service_type' => $item->service_type,
                            'description' => $item->description,
                            'amount' => $item->amount,
                        ];
                    })->toArray() ?: [
                        [
                            'service_type' => $payment->vaccination_id ? 'vaccination' : 'consultation',
                            'description' => $payment->vaccination_id
                                ? 'Vaccination: ' . ($payment->vaccination->vaccine_name ?? 'Unknown')
                                : ($payment->consultation_id
                                    ? ucfirst(str_replace('-', ' ', $payment->consultation->consultation_type ?? 'Consultation'))
                                    : 'Service'),
                            'amount' => $payment->total_amount,
                        ],
                    ]),
                ];
            });

        return Inertia::render('billing', [
            'pendingPayments' => $pendingPayments,
            'paymentHistory' => $paymentHistory,
        ]);
    }

    public function processPayment(Request $request, PetPayment $payment)
    {
        $user = $request->user();
        if (! $user) {
            abort(403);
        }

        if (! $user->isAdmin()) {
            $ownerUserId = $payment->pet?->owner?->user_id;
            $isWalkInSale = $payment->pet_id === null;
            $isCreatorOfConsultation = $payment->consultation?->created_by === $user->id;

            if (($isWalkInSale && $payment->recorded_by !== $user->id)
                || (!$isWalkInSale && $ownerUserId !== $user->id && !$isCreatorOfConsultation)) {
                abort(403);
            }
        }

        $validated = $request->validate([
            'payment_method' => 'required|string|in:cash,gcash,maya,credit_card,debit_card,bank_transfer',
            'reference_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
            'deduction_amount' => 'nullable|numeric|min:0',
            'deduction_reason' => 'nullable|string|max:255',
            'deduction_type' => 'nullable|string|in:pesos,percentage',
            'final_amount' => 'nullable|numeric|min:0',
        ], [], [
            'deduction_type' => 'deduction type',
        ]);

        try {
            DB::transaction(function () use ($payment, $validated, $request) {
                $payment->update([
                    'payment_method' => $validated['payment_method'],
                    'reference_number' => $validated['reference_number'],
                    'notes' => $validated['notes'],
                    'deduction_amount' => $validated['deduction_amount'] ?? 0,
                    'deduction_reason' => $validated['deduction_reason'],
                    'deduction_type' => $validated['deduction_type'] ?? null,
                    'final_amount' => $validated['final_amount'] ?? $payment->total_amount,
                    'paid_at' => now(),
                    'recorded_by' => $request->user()->id,
                    'status' => 'paid',
                ]);

                if ($payment->consultation_id) {
                    Consultation::where('consultation_id', $payment->consultation_id)
                        ->update(['payment_status' => 'paid']);
                }

                if ($payment->vaccination_id) {
                    Vaccination::where('vaccination_id', $payment->vaccination_id)
                        ->update(['payment_status' => 'paid']);
                }
            });

            return redirect()->back()->with('success', 'Payment processed successfully!');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Payment processing failed: ' . $e->getMessage());
            return redirect()->back()->withErrors(['general' => 'Failed to process payment. Please try again.']);
        }
    }
}
