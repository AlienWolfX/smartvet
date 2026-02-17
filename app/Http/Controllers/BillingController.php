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
        $pendingPayments = $this->scopeThroughPetOwner(PetPayment::with(['pet.owner', 'consultation', 'vaccination'])
            ->where('status', 'pending'))
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($payment) {
                $isVaccination = $payment->vaccination_id !== null;
                $isConsultation = $payment->consultation_id !== null;
                
                return [
                    'id' => $payment->id,
                    'type' => $isVaccination ? 'vaccination' : 'consultation',
                    'date' => $payment->created_at->format('Y-m-d'),
                    'petName' => $payment->pet->name,
                    'ownerName' => $payment->pet->owner->name,
                    'service' => $isVaccination 
                        ? 'Vaccination: ' . ($payment->vaccination->vaccine_name ?? 'Unknown')
                        : ($isConsultation 
                            ? ucfirst(str_replace('-', ' ', $payment->consultation->consultation_type ?? 'Consultation'))
                            : 'Service'),
                    'amount' => $payment->total_amount,
                    'status' => $payment->status,
                ];
            });

        $paymentHistory = $this->scopeThroughPetOwner(PetPayment::with(['pet.owner', 'recordedBy'])
            ->where('status', 'paid'))
            ->orderBy('paid_at', 'desc')
            ->get()
            ->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'date' => optional($payment->paid_at)->format('Y-m-d H:i'),
                    'petName' => $payment->pet->name,
                    'ownerName' => $payment->pet->owner->name,
                    'amount' => $payment->total_amount,
                    'method' => $payment->payment_method
                        ? ucfirst($payment->payment_method)
                        : null,
                    'reference' => $payment->reference_number,
                    'status' => $payment->status,
                    'recordedBy' => $payment->recordedBy->name ?? 'System',
                ];
            });

        return Inertia::render('billing', [
            'pendingPayments' => $pendingPayments,
            'paymentHistory' => $paymentHistory,
        ]);
    }

    public function processPayment(Request $request, PetPayment $payment)
    {
        // Verify ownership
        $user = auth()->user();
        if (!$user->isAdmin()) {
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
            DB::transaction(function () use ($payment, $validated) {
                // Update the PetPayment record
                $payment->update([
                    'payment_method' => $validated['payment_method'],
                    'reference_number' => $validated['reference_number'],
                    'notes' => $validated['notes'],
                    'paid_at' => now(),
                    'recorded_by' => auth()->id(),
                    'status' => 'paid',
                ]);

                // If it's a consultation payment, update the consultation payment_status
                if ($payment->consultation_id) {
                    Consultation::where('id', $payment->consultation_id)
                        ->update(['payment_status' => 'paid']);
                }

                // If it's a vaccination payment, update the vaccination payment_status
                if ($payment->vaccination_id) {
                    Vaccination::where('id', $payment->vaccination_id)
                        ->update(['payment_status' => 'paid']);
                }
            });

            return redirect()->back()->with('success', 'Payment processed successfully!');
        } catch (\Exception $e) {
            \Log::error('Payment processing failed: ' . $e->getMessage());
            return redirect()->back()->withErrors(['general' => 'Failed to process payment. Please try again.']);
        }
    }
}
