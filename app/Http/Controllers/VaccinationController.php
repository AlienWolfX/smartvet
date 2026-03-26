<?php

namespace App\Http\Controllers;

use App\Models\Consultation;
use App\Models\InventoryItem;
use App\Models\Pet;
use App\Models\PetPayment;
use App\Models\PetPaymentItem;
use App\Models\Vaccination;
use App\Http\Traits\ScopesToTenant;
use App\Services\InventoryUsageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class VaccinationController extends Controller
{
    use ScopesToTenant;
    public function store(Request $request, string $petId): RedirectResponse
    {
        $numericId = (int) str_replace('PET-', '', $petId);

        $pet = $this->scopePetToUser(Pet::query()->where('id', $numericId))->first();
        if (! $pet) {
            return redirect()->back()->withErrors(['pet' => 'Pet not found']);
        }

        $validated = $request->validate([
            'consultation_id' => 'nullable|exists:consultations,id',
            'vaccine_name' => 'required|string|max:255',
            'vaccine_type' => 'nullable|string|max:255',
            'vaccination_date' => 'required|date',
            'next_due_date' => 'required|date|after_or_equal:vaccination_date',
            'batch_number' => 'nullable|string|max:255',
            'manufacturer' => 'nullable|string|max:255',
            'administered_by' => 'nullable|string|max:255',
            'clinic_location' => 'nullable|string|max:255',
            'vaccination_fee' => 'nullable|numeric|min:0|max:999999.99',
            'notes' => 'nullable|string|max:1000',
            'adverse_reactions' => 'nullable|string|max:1000',
            'inventory_items' => 'nullable|array',
            'inventory_items.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'inventory_items.*.quantity' => 'required|integer|min:1',
        ], [
            'vaccine_name.required' => 'Please provide a vaccine name',
            'vaccination_date.required' => 'Please select the vaccination date',
            'next_due_date.required' => 'Please select the next due date',
            'next_due_date.after_or_equal' => 'The next due date cannot be before the vaccination date',
        ]);

        if (! empty($validated['consultation_id'])) {
            $consultationExists = Consultation::where('id', $validated['consultation_id'])
                ->where('pet_id', $numericId)
                ->exists();

            if (! $consultationExists) {
                return redirect()->back()->withErrors(['consultation_id' => 'Selected consultation is invalid for this pet']);
            }
        }

        $inventoryItems = $request->input('inventory_items', []);
        $vaccinationFee = $validated['vaccination_fee'] ?? 0;

        DB::transaction(function () use ($numericId, $validated, $inventoryItems, $vaccinationFee) {
            // Create the vaccination record
            $vaccinationData = collect($validated)->except(['vaccination_fee', 'inventory_items', 'administered_by'])->toArray();
            $vaccination = Vaccination::create(array_merge($vaccinationData, [
                'pet_id' => $numericId,
                'payment_status' => 'pending',
                'administered_by' => Auth::user()->name,
            ]));

            $payment = PetPayment::create([
                'pet_id' => $numericId,
                'vaccination_id' => $vaccination->id,
                'total_amount' => $vaccinationFee,
                'status' => 'pending',
                'recorded_by' => Auth::id(),
                'notes' => "Vaccination: {$validated['vaccine_name']}",
            ]);

            PetPaymentItem::create([
                'pet_payment_id' => $payment->id,
                'service_type' => 'vaccination',
                'service_id' => $vaccination->id,
                'description' => 'Vaccine: ' . $validated['vaccine_name'],
                'amount' => $vaccinationFee,
            ]);

            if (! empty($inventoryItems)) {
                app(InventoryUsageService::class)->attach($vaccination, $inventoryItems);

                foreach ($inventoryItems as $item) {
                    $inventoryModel = InventoryItem::find($item['inventory_item_id']);
                    if (! $inventoryModel) {
                        continue;
                    }

                    PetPaymentItem::create([
                        'pet_payment_id' => $payment->id,
                        'service_type' => 'inventory_item',
                        'service_id' => $inventoryModel->id,
                        'description' => $inventoryModel->name . ' x' . $item['quantity'],
                        'amount' => $inventoryModel->unit_price * $item['quantity'],
                    ]);
                }
            }
        });

        return redirect()->back()->with('success', 'Vaccination record added successfully!');
    }

    public function update(Request $request, string $petId, Vaccination $vaccination): RedirectResponse
    {
        $numericId = (int) str_replace('PET-', '', $petId);

        $pet = $this->scopePetToUser(Pet::query()->where('id', $numericId))->first();
        if (! $pet) {
            return redirect()->back()->withErrors(['pet' => 'Pet not found']);
        }

        // Ensure the vaccination belongs to this pet
        if ($vaccination->pet_id !== $numericId) {
            return redirect()->back()->withErrors(['vaccination' => 'Vaccination record not found for this pet']);
        }

        $validated = $request->validate([
            'vaccine_name' => 'required|string|max:255',
            'vaccination_date' => 'required|date',
            'next_due_date' => 'required|date|after_or_equal:vaccination_date',
            'administered_by' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
            'adverse_reactions' => 'nullable|string|max:1000',
        ], [
            'vaccine_name.required' => 'Please provide a vaccine name',
            'vaccination_date.required' => 'Please select the vaccination date',
            'next_due_date.required' => 'Please select the next due date',
            'next_due_date.after_or_equal' => 'The next due date cannot be before the vaccination date',
        ]);

        $vaccination->update($validated);

        return redirect()->back()->with('success', 'Vaccination record updated successfully!');
    }
}
