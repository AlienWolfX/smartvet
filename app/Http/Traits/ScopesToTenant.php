<?php

namespace App\Http\Traits;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

/**
 * Provides tenant-scoping helper methods for controllers.
 *
 * Root tables (owners, inventory_items) have a direct `user_id` column.
 * Child tables inherit tenancy through their parent relationships:
 *   pets → owners.user_id
 *   consultations/vaccinations/medications → pets.owner_id → owners.user_id
 *   pet_payments → pets.owner_id → owners.user_id
 *   inventory_usages → inventory_items.user_id
 *
 * Admin users see ALL data. Clinic users see only their own.
 */
trait ScopesToTenant
{
    /**
     * Scope a query on a root tenant table (has direct user_id column).
     */
    protected function scopeToUser(Builder $query): Builder
    {
        /** @var User|null $user */
        $user = Auth::user();
        if ($user && !$user->isAdmin()) {
            return $query->where($query->getModel()->getTable() . '.user_id', $user->id);
        }
        return $query;
    }

    /**
     * Scope a query for models related to owners through pets (e.g. Consultation, Vaccination, Medication, PetPayment).
     */
    protected function scopeThroughPetOwner(Builder $query): Builder
    {
        /** @var User|null $user */
        $user = Auth::user();
        if ($user && !$user->isAdmin()) {
            return $query->whereHas('pet.owner', function (Builder $q) use ($user) {
                $q->where('owners.user_id', $user->id);
            });
        }
        return $query;
    }

    /**
     * Scope PetPayment queries for the authenticated user.
     * Includes payments for owned pets or walk-in payments recorded by the user.
     */
    protected function scopePetPaymentToUser(Builder $query): Builder
    {
        /** @var User|null $user */
        $user = Auth::user();
        if ($user && !$user->isAdmin()) {
            return $query->where(function (Builder $q) use ($user) {
                $q->whereHas('pet.owner', function (Builder $subQuery) use ($user) {
                    $subQuery->where('owners.user_id', $user->id);
                })
                ->orWhere(function (Builder $subQuery) use ($user) {
                    $subQuery->whereNull('pet_id')
                        ->where('recorded_by', $user->id);
                });
            });
        }

        return $query;
    }

    /**
     * Scope a Pet query through its owner or clinic_ids access.
     * Includes pets where:
     * 1. The user owns the pet (via owner.user_id), OR
     * 2. The user's clinic ID is in the pet's clinic_ids array (for imported pets)
     */
    protected function scopePetToUser(Builder $query): Builder
    {
        /** @var User|null $user */
        $user = Auth::user();
        if ($user && !$user->isAdmin()) {
            return $query->where(function (Builder $q) use ($user) {
                // Pets owned by this clinic
                $q->whereHas('owner', function (Builder $subQ) use ($user) {
                    $subQ->where('owners.user_id', $user->id);
                })
                    // OR pets imported from other clinics (clinic_id in clinic_ids array)
                    ->orWhereJsonContains('clinic_ids', $user->id);
            });
        }
        return $query;
    }

    /**
     * Get the authenticated user's ID for assigning to new records.
     */
    protected function tenantUserId(): ?int
    {
        return Auth::id();
    }
}
