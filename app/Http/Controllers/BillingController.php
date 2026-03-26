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
        $pendingPayments = $this->scopeThroughPetOwner(PetPayment::with(['pet.owner', 'consultation', 'vaccination', 'items'])
            ->where('status', 'pending'))
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($payment) {
                $isVaccination = $payment->vaccination_id !== null;
                $isConsultation = $payment->consultation_id !== null;

                return [
                    'id' => $payment->id,
                    'type' => $isVaccination ? 'vaccination' : 'consultation',
                    'date' => $payment->created_at->format('F j, Y h:i A'),
                    'createdAt' => $payment->created_at->toDateTimeString(),
                    'petName' => $payment->pet->name,
                    'ownerName' => $payment->pet->owner->name,
                    'service' => $isVaccination
                        ? 'Vaccination: ' . ($payment->vaccination->vaccine_name ?? 'Unknown')
                        : ($isConsultation
                            ? ucfirst(str_replace('-', ' ', $payment->consultation->consultation_type ?? 'Consultation'))
                            : 'Service'),
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

        $paymentHistory = $this->scopeThroughPetOwner(PetPayment::with(['pet.owner', 'recordedBy', 'items'])
            ->where('status', 'paid'))
            ->orderBy('paid_at', 'desc')
            ->get()
            ->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'date' => optional($payment->paid_at)->format('F j, Y h:i A'),
                    'paidAt' => optional($payment->paid_at)->toDateTimeString(),
                    'petName' => $payment->pet->name,
                    'ownerName' => $payment->pet->owner->name,
                    'amount' => $payment->total_amount,
                    'method' => $payment->payment_method
                        ? ucfirst($payment->payment_method)
                        : null,
                    'reference' => $payment->reference_number,
                    'status' => $payment->status,
                    'recordedBy' => $payment->recordedBy->name ?? 'System',
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
            if ($ownerUserId !== $user->id) {
                abort(403);
            }
        }

        $validated = $request->validate([
            'payment_method' => 'required|string|in:cash,gcash,maya,credit_card,debit_card,bank_transfer',
            'reference_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            DB::transaction(function () use ($payment, $validated, $request) {
                $payment->update([
                    'payment_method' => $validated['payment_method'],
                    'reference_number' => $validated['reference_number'],
                    'notes' => $validated['notes'],
                    'paid_at' => now(),
                    'recorded_by' => $request->user()->id,
                    'status' => 'paid',
                ]);

                if ($payment->consultation_id) {
                    Consultation::where('id', $payment->consultation_id)
                        ->update(['payment_status' => 'paid']);
                }

                if ($payment->vaccination_id) {
                    Vaccination::where('id', $payment->vaccination_id)
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
