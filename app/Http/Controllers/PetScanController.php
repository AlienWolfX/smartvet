<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

class PetScanController extends Controller
{
    /**
     * Legacy scan URL endpoint.
     * We now use the clinic scanner page as the single scanning experience.
     */
    public function scan(string $token): RedirectResponse
    {
        return redirect()->route('pet-records.scan');
    }

    /**
     * Authenticated JSON endpoint — used by the clinic scanner modal.
     */
    public function clinicScan(string $token): JsonResponse
    {
        $pet = Pet::with([
            'owner',
            'species',
            'vaccinations',
            'consultations',
        ])->where('qr_token', $token)->firstOrFail();

        return response()->json([
            'pet' => [
                'name'        => $pet->name,
                'species'     => $pet->species->name,
                'breed'       => $pet->breed ?? 'Mixed',
                'age'         => $pet->age,
                'gender'      => $pet->gender,
                'color'       => $pet->color,
                'microchipId' => $pet->microchip_id,
                'imageUrl'    => $pet->image_path ? asset('storage/' . $pet->image_path) : null,
                'status'      => $pet->status,
                'publicUrl'   => route('pet-records.scan'),
                'manageUrl'   => url('/pet-records/PET-' . str_pad($pet->id, 3, '0', STR_PAD_LEFT) . '/manage'),
            ],
            'owner' => [
                'name'  => $pet->owner->name,
                'phone' => $pet->owner->phone,
                'email' => $pet->owner->email,
            ],
            'vaccinations'  => $pet->vaccinations->map(fn ($v) => [
                'vaccine' => $v->vaccine_name,
                'date'    => $v->vaccination_date->toDateString(),
                'nextDue' => $v->next_due_date->toDateString(),
            ]),
            'consultations' => $pet->consultations->map(fn ($c) => [
                'type'      => $c->consultation_type,
                'date'      => $c->consultation_date->toDateString(),
                'complaint' => $c->chief_complaint,
                'diagnosis' => $c->diagnosis,
            ]),
        ]);
    }
}
