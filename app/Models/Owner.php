<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Owner extends Model
{
    use HasFactory, HasAliasedPrimaryKey;

    protected $primaryKey = 'owner_id';

    protected $fillable = [
        'user_id',
        'account_user_id',
        'name',
        'phone',
        'email',
        'address',
        'street',
        'barangay',
        'city',
        'province',
        'zip_code',
        'emergency_contact',
    ];

    /**
     * Get the full formatted address.
     */
    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->street,
            $this->barangay,
            $this->city,
            $this->province,
            $this->zip_code,
        ]);

        return $parts ? implode(', ', $parts) : ($this->address ?? '');
    }

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function pets(): HasMany
    {
        return $this->hasMany(Pet::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function accountUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'account_user_id');
    }
}
