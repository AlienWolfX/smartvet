<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\InventoryUsage;

class Medication extends Model
{
    use HasFactory, HasAliasedPrimaryKey;

    protected $primaryKey = 'medication_id';

    protected $fillable = [
        'pet_id',
        'consultation_id',
        'medication_name',
        'generic_name',
        'dosage',
        'frequency',
        'route',
        'purpose',
        'start_date',
        'end_date',
        'duration_days',
        'cost',
        'prescribed_by',
        'instructions',
        'side_effects',
        'notes',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'cost' => 'decimal:2',
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

    public function inventoryUsages(): MorphMany
    {
        return $this->morphMany(InventoryUsage::class, 'usable');
    }
}
