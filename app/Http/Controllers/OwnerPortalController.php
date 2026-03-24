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
                    'microchipId' => $pet->microchip_id ?? '',
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
        /** @var \App\Models\User|null $user */
        $user = $request->user();

        if (! $user) {
            abort(401, 'Unauthenticated.');
        }

        $owner = \App\Models\Owner::where('account_user_id', $user->id)->first();
        $ownerClinicName = $owner?->user?->clinic_name;

        $clinicName = $user->clinic_name ?? $ownerClinicName ?? 'SmartVet';

        $owners = \App\Models\Owner::where('account_user_id', $user->id)->pluck('id');
        $pet = \App\Models\Pet::with(['owner', 'vaccinations', 'consultations.files', 'consultations.inventoryUsages.inventoryItem'])
            ->whereIn('owner_id', $owners)
            ->findOrFail($petId);

        $documents = $pet->consultations->flatMap(fn ($c) => $c->files)->map(fn ($f) => [
            'id'            => $f->id,
            'name'          => $f->original_name ?? $f->file_name,
            'url'           => $f->file_url,
            'mimeType'      => $f->mime_type,
            'size'          => $f->file_size,
            'sizeFormatted' => $f->file_size_formatted,
            'isImage'       => $f->isImage(),
        ]);

        return response()->json([
            'clinicName' => $user->clinic_name ?? $pet->owner?->clinic_name ?? 'SmartVet',
            'pet' => [
                'id'          => $pet->id,
                'name'        => $pet->name,
                'species'     => $pet->species?->name ?? 'Unknown',
                'breed'       => $pet->breed ?? '—',
                'age'         => $pet->age,
                'weight'      => $pet->weight,
                'gender'      => $pet->gender ?: '—',
                'color'       => $pet->color ?: '—',
                'microchipId' => $pet->microchip_id,
                'imageUrl'    => $pet->image_path ? asset('storage/' . $pet->image_path) : null,
                'status'      => $pet->status ?? 'Healthy',
            ],
            'owner' => [
                'name'             => $pet->owner?->name,
                'phone'            => $pet->owner?->phone,
                'email'            => $pet->owner?->email,
                'address'          => $pet->owner?->address,
                'street'           => $pet->owner?->street,
                'barangay'         => $pet->owner?->barangay,
                'city'             => $pet->owner?->city,
                'province'         => $pet->owner?->province,
                'zipCode'          => $pet->owner?->zip_code,
                'emergencyContact' => $pet->owner?->emergency_contact,
            ],
            'documents' => $documents,
            'vaccinations' => $pet->vaccinations->map(fn ($v) => [
                'vaccine' => $v->vaccine_name,
                'date'    => $v->vaccination_date->toDateString(),
                'nextDue' => $v->next_due_date->toDateString(),
                'clinicName' => $v->clinic_location ?? $clinicName,
            ]),
            'consultations' => $pet->consultations->map(fn ($c) => [
                'type'           => $c->consultation_type,
                'date'           => $c->consultation_date->toDateString(),
                'complaint'      => $c->chief_complaint,
                'diagnosis'      => $c->diagnosis,
                'treatment'      => $c->treatment,
                'clinicName' => $c->clinic_location ?? $clinicName,
                'inventoryItems' => $c->inventoryUsages->map(fn ($u) => [
                    'id'        => $u->id,
                    'name'      => $u->inventoryItem?->name ?? 'Item',
                    'quantity'  => $u->quantity,
                    'unitPrice' => $u->unit_price,
                ]),
                'files'          => $c->files->map(fn ($f) => [
                    'id'            => $f->id,
                    'name'          => $f->original_name ?? $f->file_name,
                    'url'           => $f->file_url,
                    'mimeType'      => $f->mime_type,
                    'size'          => $f->file_size,
                    'sizeFormatted' => $f->file_size_formatted,
                    'isImage'       => $f->isImage(),
                ]),
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
            'petImage' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        if ($request->hasFile('petImage')) {
            // Delete old image
            if ($pet->image_path) {
                Storage::disk('public')->delete($pet->image_path);
            }

            $newImagePath = $request->file('petImage')->store('pets', 'public');
            $pet->update(['image_path' => $newImagePath]);

            return redirect()->route('owner.pets')->with('success', "{$pet->name}'s photo has been updated.");
        }

        return redirect()->route('owner.pets')->with('info', 'No photo selected. Pet profile remains unchanged.');
    }
}
