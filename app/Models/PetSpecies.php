<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PetSpecies extends Model
{
    use HasFactory, HasAliasedPrimaryKey;

    protected $primaryKey = 'pet_species_id';

    protected $table = 'pet_species';

    protected $fillable = [
        'name',
        'icon',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function pets(): HasMany
    {
        return $this->hasMany(Pet::class, 'pet_species_id', 'pet_species_id');
    }
}
