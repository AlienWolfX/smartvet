<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryCategory extends Model
{
    use HasFactory, HasAliasedPrimaryKey;

    protected $primaryKey = 'inventory_category_id';

    protected $fillable = [
        'name',
        'slug',
        'icon',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(InventoryItem::class, 'inventory_category_id', 'inventory_category_id');
    }
}
