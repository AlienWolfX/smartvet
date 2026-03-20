<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\PetPayment;

class Pet extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'owner_id',
        'species_id',
        'breed',
        'age',
        'weight',
        'gender',
        'color',
        'microchip_id',
        'qr_token',
        'image_path',
        'status',
        'last_visit',
    ];

    protected $casts = [
        'last_visit' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'weight' => 'decimal:2',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(Owner::class);
    }

    public function species(): BelongsTo
    {
        return $this->belongsTo(PetSpecies::class, 'species_id');
    }

    public function consultations(): HasMany
    {
        return $this->hasMany(Consultation::class);
    }

    public function vaccinations(): HasMany
    {
        return $this->hasMany(Vaccination::class);
    }

    public function medications(): HasMany
    {
        return $this->hasMany(Medication::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(PetPayment::class);
    }
}
