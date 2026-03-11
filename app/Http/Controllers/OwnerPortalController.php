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
                    'imageUrl'    => $pet->image_path ? '/storage/' . $pet->image_path : null,
                ];
            });
        })->values()->all();

        // If no pets yet, inject a placeholder so the UI shows how it will look
        $dummy = null;
        if (empty($pets)) {
            $dummy = [
                'id'          => 'demo',
                'name'        => 'Buddy',
                'species'     => 'Dog',
                'speciesIcon' => '🐕',
                'breed'       => 'Golden Retriever',
                'age'         => 3,
                'weight'      => '28.50',
                'gender'      => 'Male',
                'color'       => 'Golden',
                'status'      => 'Healthy',
                'lastVisit'   => 'Feb 15, 2026',
                'imageUrl'    => null,
                'isDemo'      => true,
            ];
        }

        return Inertia::render('owner/my-pets', [
            'pets'  => $pets,
            'dummy' => $dummy,
        ]);
    }

    public function settings(Request $request)
    {
        return Inertia::render('owner/settings', [
            'status' => $request->session()->get('status'),
        ]);
    }
}
