<?php

namespace App\Http\Controllers;

use App\Models\Consultation;
use App\Models\Medication;
use App\Models\Pet;
use App\Http\Traits\ScopesToTenant;
use App\Services\InventoryUsageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MedicationController extends Controller
{
    use ScopesToTenant;
    public function store(Request $request, string $petId): RedirectResponse
    {
        $numericId = (int) str_replace('PET-', '', $petId);

        $pet = $this->scopePetToUser(Pet::where('pet_id', $numericId))->first();
        if (! $pet) {
            return redirect()->back()->withErrors(['pet' => 'Pet not found']);
        }

        $validated = $request->validate([
            'consultation_id' => 'nullable|exists:consultations,consultation_id',
            'medication_name' => 'required|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'dosage' => 'required|string|max:255',
            'frequency' => 'required|string|max:255',
            'route' => 'required|string|max:255',
            'purpose' => 'required|string|max:1000',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'cost' => 'nullable|numeric|min:0|max:999999.99',
            'prescribed_by' => 'nullable|string|max:255',
            'instructions' => 'nullable|string|max:1000',
            'side_effects' => 'nullable|string|max:1000',
            'notes' => 'nullable|string|max:1000',
            'status' => 'nullable|in:active,completed,discontinued,on-hold',
            'inventory_items' => 'nullable|array',
            'inventory_items.*.inventory_item_id' => 'required|exists:inventory_items,inventory_item_id',
            'inventory_items.*.quantity' => 'required|integer|min:1',
        ], [
            'medication_name.required' => 'Medication name is required',
            'dosage.required' => 'Dosage is required',
            'frequency.required' => 'Frequency is required',
            'route.required' => 'Route of administration is required',
            'purpose.required' => 'Purpose is required',
            'start_date.required' => 'Please provide a start date',
            'end_date.after_or_equal' => 'End date must be on or after the start date',
        ]);

        if (! empty($validated['consultation_id'])) {
            $consultationExists = Consultation::where('consultation_id', $validated['consultation_id'])
                ->where('pet_id', $numericId)
                ->exists();

            if (! $consultationExists) {
                return redirect()->back()->withErrors(['consultation_id' => 'Selected consultation is invalid for this pet']);
            }
        }

        $inventoryItems = $request->input('inventory_items', []);

        DB::transaction(function () use ($numericId, $validated, $inventoryItems) {
            $medication = Medication::create(array_merge($validated, [
                'pet_id' => $numericId,
                'status' => $validated['status'] ?? 'active',
            ]));

            if (! empty($validated['start_date']) && ! empty($validated['end_date'])) {
                $start = Carbon::parse($validated['start_date']);
                $end = Carbon::parse($validated['end_date']);
                $medication->duration_days = $start->diffInDays($end) + 1;
                $medication->save();
            }

            if (! empty($inventoryItems)) {
                app(InventoryUsageService::class)->attach($medication, $inventoryItems);
            }
        });

        return redirect()->back()->with('success', 'Medication record added successfully!');
    }
}
