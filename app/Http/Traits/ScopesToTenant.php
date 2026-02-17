<?php

namespace App\Http\Traits;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

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
        $user = auth()->user();
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
        $user = auth()->user();
        if ($user && !$user->isAdmin()) {
            return $query->whereHas('pet.owner', fn (Builder $q) => $q->where('owners.user_id', $user->id));
        }
        return $query;
    }

    /**
     * Scope a Pet query through its owner.
     */
    protected function scopePetToUser(Builder $query): Builder
    {
        $user = auth()->user();
        if ($user && !$user->isAdmin()) {
            return $query->whereHas('owner', fn (Builder $q) => $q->where('owners.user_id', $user->id));
        }
        return $query;
    }

    /**
     * Get the authenticated user's ID for assigning to new records.
     */
    protected function tenantUserId(): ?int
    {
        return auth()->id();
    }
}
