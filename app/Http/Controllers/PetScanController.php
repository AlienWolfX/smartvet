<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use App\Models\User;
use App\Models\ClinicVisibilityPermission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class PetScanController extends Controller
{
    public function scan(string $token): RedirectResponse
    {
        return redirect()->route('pet-records.scan');
    }

    /**
     * Check if a clinic has permission to view another clinic's history.
     */
    private function canViewClinicHistory($currentClinicId, $targetClinicId): bool
    {
        // Own clinic can always view its own history
        if ($currentClinicId === $targetClinicId) {
            return true;
        }

        // Check if there's an explicit permission
        return ClinicVisibilityPermission::where('granting_clinic_id', $targetClinicId)
            ->where('receiving_clinic_id', $currentClinicId)
            ->exists();
    }

    /**
     * Authenticated JSON endpoint — used by the clinic scanner modal.
     */
    public function clinicScan(string $token): JsonResponse
    {
        $user = Auth::user();
        $currentUserId = $user?->getKey();
        $currentClinicId = $user?->getKey();

        $pet = Pet::with([
            'owner.user',
            'species',
            'vaccinations',
            'consultations.files',
            'consultations.inventoryUsages.inventoryItem',
        ])->where('qr_token', $token)->firstOrFail();

        $registeredClinicId = $pet->clinic_ids[0] ?? null;
        $registeredClinicName = $registeredClinicId
            ? User::where('user_id', $registeredClinicId)->value('clinic_name')
            : null;

        $clinicName = $registeredClinicName
            ?? $pet->owner?->user?->clinic_name
            ?? $user?->clinic_name
            ?? 'SmartVet';

        // Get the pet's owner clinic ID
        $petOwnerClinicId = $pet->owner?->user_id;

        // Check if current clinic has permission to view this pet's history
        $hasPermission = $this->canViewClinicHistory($currentClinicId, $petOwnerClinicId);

        // Only show history if they have permission
        $visibleConsultations = $hasPermission ? $pet->consultations : collect();

        $documents = $visibleConsultations->flatMap(fn ($c) => $c->files)->map(fn ($f) => [
            'id'            => $f->getKey(),
            'name'          => $f->original_name ?? $f->file_name,
            'url'           => $f->file_url,
            'mimeType'      => $f->mime_type,
            'size'          => $f->file_size,
            'sizeFormatted' => $f->file_size_formatted,
            'isImage'       => $f->isImage(),
        ]);

        return response()->json([
            'clinicName' => $clinicName,
            'hasHistoryAccess' => $hasPermission,
            'pet' => [
                'name'        => $pet->name,
                'species'     => $pet->species->name,
                'breed'       => $pet->breed ?? 'Mixed',
                'age'         => $pet->age,
                'weight'      => $pet->weight,
                'gender'      => $pet->gender,
                'color'       => $pet->color,
                'clinicIds'   => $pet->clinic_ids ?? [],
                'imageUrl'    => $pet->image_path ? asset('storage/' . $pet->image_path) : null,
                'status'      => $pet->status,
                'publicUrl'   => route('pet-records.scan'),
                'manageUrl'   => url('/pet-records/PET-' . str_pad($pet->getKey(), 3, '0', STR_PAD_LEFT) . '/manage'),
            ],
            'owner' => [
                'name'             => $pet->owner->name,
                'phone'            => $pet->owner->phone,
                'email'            => $pet->owner->email,
                'address'          => $pet->owner->address,
                'street'           => $pet->owner->street,
                'barangay'         => $pet->owner->barangay,
                'city'             => $pet->owner->city,
                'province'         => $pet->owner->province,
                'zipCode'          => $pet->owner->zip_code,
                'emergencyContact' => $pet->owner->emergency_contact,
                'clinicUserId'     => $pet->owner->user_id,
            ],
            'documents'      => $documents,
            'vaccinations'   => ($hasPermission ? $pet->vaccinations : collect())->map(function ($v) use ($pet, $clinicName) {
                $ownerClinicName = $pet->owner?->user?->clinic_name ?? $clinicName;
                return [
                    'vaccine'    => $v->vaccine_name,
                    'date'       => $v->vaccination_date->toDateString(),
                    'nextDue'    => $v->next_due_date->toDateString(),
                    'clinicName' => $ownerClinicName,
                ];
            })->values(),
            'consultations' => $visibleConsultations->map(function ($c) use ($pet, $clinicName) {
                $ownerClinicName = $pet->owner?->user?->clinic_name ?? $clinicName;
                return [
                    'type'       => $c->consultation_type,
                    'date'       => $c->consultation_date->toDateString(),
                    'weight'     => $c->weight,
                    'complaint'  => $c->chief_complaint,
                    'diagnosis'  => $c->diagnosis,
                    'treatment'  => $c->treatment,
                    'clinicName' => $ownerClinicName,
                    'inventoryItems' => $c->inventoryUsages->map(fn ($u) => [
                        'id'        => $u->getKey(),
                        'name'      => $u->inventoryItem?->name ?? 'Item',
                        'quantity'  => $u->quantity,
                        'unitPrice' => $u->unit_price,
                    ]),
                    'files' => $c->files->map(fn ($f) => [
                        'id'            => $f->getKey(),
                        'name'          => $f->original_name ?? $f->file_name,
                        'url'           => $f->file_url,
                        'mimeType'      => $f->mime_type,
                        'size'          => $f->file_size,
                        'sizeFormatted' => $f->file_size_formatted,
                        'isImage'       => $f->isImage(),
                    ]),
                ];
            })->values(),
        ]);
    }
}
