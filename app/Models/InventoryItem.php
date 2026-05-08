<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryItem extends Model
{
    use HasFactory, HasAliasedPrimaryKey;

    protected $primaryKey = 'inventory_item_id';

    protected $fillable = [
        'user_id',
        'item_code',
        'inventory_category_id',
        'name',
        'brand',
        'batch_number',
        'current_stock',
        'min_stock',
        'max_stock',
        'unit_price',
        'expiry_date',
        'supplier',
        'location',
        'description',
        'last_restocked_at',
    ];

    protected $casts = [
        'current_stock' => 'integer',
        'min_stock' => 'integer',
        'max_stock' => 'integer',
        'unit_price' => 'decimal:2',
        'expiry_date' => 'date',
        'last_restocked_at' => 'date',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(InventoryCategory::class, 'inventory_category_id', 'inventory_category_id');
    }

    public function inventoryUsages(): HasMany
    {
        return $this->hasMany(InventoryUsage::class, 'inventory_item_id', 'inventory_item_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
