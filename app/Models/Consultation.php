<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\InventoryUsage;
use App\Models\PetPayment;

class Consultation extends Model
{
    use HasFactory, HasAliasedPrimaryKey;

    protected $primaryKey = 'consultation_id';

    protected $fillable = [
        'pet_id',
        'consultation_type',
        'chief_complaint',
        'diagnosis',
        'treatment',
        'notes',
        'consultation_fee',
        'weight',
        'veterinarian',
        'consultation_date',
        'consultation_time',
        'status',
        'payment_status',
        'created_by',
    ];

    protected $casts = [
        'consultation_date' => 'date',
        'consultation_fee' => 'decimal:2',
        'weight' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(ConsultationFile::class);
    }

    public function medications(): HasMany
    {
        return $this->hasMany(Medication::class);
    }

    public function vaccinations(): HasMany
    {
        return $this->hasMany(Vaccination::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(PetPayment::class, 'consultation_id');
    }

    public function inventoryUsages(): MorphMany
    {
        return $this->morphMany(InventoryUsage::class, 'usable');
    }
}
