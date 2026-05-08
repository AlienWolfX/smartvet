<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\InventoryUsage;

class Vaccination extends Model
{
    use HasFactory, HasAliasedPrimaryKey;

    protected $primaryKey = 'vaccination_id';

    protected $fillable = [
        'pet_id',
        'consultation_id',
        'vaccine_name',
        'vaccine_type',
        'vaccination_date',
        'next_due_date',
        'batch_number',
        'manufacturer',
        'administered_by',
        'clinic_location',
        'notes',
        'adverse_reactions',
        'payment_status',
    ];

    protected $casts = [
        'vaccination_date' => 'date',
        'next_due_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class);
    }

    public function consultation(): BelongsTo
    {
        return $this->belongsTo(Consultation::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(PetPayment::class);
    }

    public function inventoryUsages(): MorphMany
    {
        return $this->morphMany(InventoryUsage::class, 'usable');
    }
}
