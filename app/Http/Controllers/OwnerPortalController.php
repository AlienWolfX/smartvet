<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Laravel\Fortify\Fortify;

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
                    'speciesId'   => $pet->species_id,
                    'speciesIcon' => $pet->species?->icon ?? '🐾',
                    'breed'       => $pet->breed ?? '—',
                    'age'         => $pet->age,
                    'weight'      => $pet->weight,
                    'gender'      => $pet->gender ?: '—',
                    'color'       => $pet->color ?: '—',
                    'status'      => $pet->status ?? 'Healthy',
                    'lastVisit'   => $pet->last_visit?->format('M d, Y'),
                    'imageUrl'    => $pet->image_path ? asset('storage/' . $pet->image_path) : null,
                    'qrToken'     => $pet->qr_token,
                ];
            });
        })->values()->all();

        $speciesList = \App\Models\PetSpecies::orderBy('name')->get()->map(fn ($s) => [
            'id'   => $s->id,
            'name' => $s->name,
            'icon' => $s->icon,
        ])->all();

        return Inertia::render('owner/my-pets', [
            'pets'        => $pets,
            'speciesList' => $speciesList,
        ]);
    }

    public function settings(Request $request)
    {
        $user = $request->user();
        $requiresConfirmation = Fortify::confirmsTwoFactorAuthentication();
        $hasSecret = !is_null($user?->two_factor_secret);
        $isConfirmed = !is_null($user?->two_factor_confirmed_at);

        return Inertia::render('owner/settings', [
            'status' => $request->session()->get('status'),
            'twoFactorEnabled' => $hasSecret && (!$requiresConfirmation || $isConfirmed),
            'twoFactorPending' => $hasSecret && $requiresConfirmation && !$isConfirmed,
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

    public function updatePet(Request $request, $petId)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $ownerIds = \App\Models\Owner::where('account_user_id', $user->id)->pluck('id');
        $pet = \App\Models\Pet::whereIn('owner_id', $ownerIds)->findOrFail($petId);

        $validated = $request->validate([
            'name'       => 'required|string|max:100',
            'species_id' => 'required|exists:pet_species,id',
            'breed'      => 'nullable|string|max:100',
            'age'        => 'nullable|integer|min:0|max:100',
            'weight'     => 'nullable|numeric|min:0|max:999',
            'gender'     => 'nullable|in:Male,Female',
            'color'      => 'nullable|string|max:100',
            'petImage'   => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        if ($request->hasFile('petImage')) {
            // Delete old image
            if ($pet->image_path) {
                Storage::disk('public')->delete($pet->image_path);
            }
            $validated['image_path'] = $request->file('petImage')->store('pets', 'public');
        }

        unset($validated['petImage']);

        $pet->update($validated);

        return redirect()->route('owner.pets')->with('success', "{$pet->name}'s info has been updated.");
    }
}
