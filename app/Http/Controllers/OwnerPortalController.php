<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class OwnerPortalController extends Controller
{
    public function myPets(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $owners = \App\Models\Owner::where('account_user_id', $user->id)
            ->with(['pets.species'])
            ->get();

        $pets = $owners->flatMap(function ($owner) {
            return $owner->pets->map(function ($pet) {
                return [
                    'id'          => $pet->id,
                    'name'        => $pet->name,
                    'species'     => $pet->species?->name ?? 'Unknown',
                    'speciesIcon' => $pet->species?->icon ?? '🐾',
                    'breed'       => $pet->breed ?? '—',
                    'age'         => $pet->age,
                    'weight'      => $pet->weight,
                    'gender'      => $pet->gender ?? '—',
                    'color'       => $pet->color ?? '—',
                    'status'      => $pet->status ?? 'Healthy',
                    'lastVisit'   => $pet->last_visit?->format('M d, Y'),
                    'imageUrl'    => $pet->image_path ? asset('storage/' . $pet->image_path) : null,
                    'qrToken'     => $pet->qr_token,
                ];
            });
        })->values()->all();

        return Inertia::render('owner/my-pets', [
            'pets' => $pets,
        ]);
    }

    public function settings(Request $request)
    {
        return Inertia::render('owner/settings', [
            'status' => $request->session()->get('status'),
        ]);
    }

    public function petRecord(Request $request, $petId)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $owners = \App\Models\Owner::where('account_user_id', $user->id)->pluck('id');
        $pet = \App\Models\Pet::with(['vaccinations', 'consultations'])
            ->whereIn('owner_id', $owners)
            ->findOrFail($petId);

        return response()->json([
            'vaccinations' => $pet->vaccinations->map(fn ($v) => [
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
