<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use Inertia\Inertia;

class PetScanController extends Controller
{
    /**
     * Public pet profile page — no authentication required.
     * Displays pet info and visit history to anyone who scans the QR.
     */
    public function scan(string $token)
    {
        $pet = Pet::with([
            'owner',
            'species',
            'vaccinations',
            'consultations',
        ])->where('qr_token', $token)->firstOrFail();

        $vaccinations = $pet->vaccinations->map(fn ($v) => [
            'vaccine'  => $v->vaccine_name,
            'date'     => $v->vaccination_date->toDateString(),
            'nextDue'  => $v->next_due_date->toDateString(),
        ]);

        $consultations = $pet->consultations->map(fn ($c) => [
            'type'      => $c->consultation_type,
            'date'      => $c->consultation_date->toDateString(),
            'complaint' => $c->chief_complaint,
            'diagnosis' => $c->diagnosis,
        ]);

        return Inertia::render('pet-scan', [
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
            ],
            'owner' => [
                'name' => $pet->owner->name,
            ],
            'vaccinations'  => $vaccinations,
            'consultations' => $consultations,
        ]);
    }
}
