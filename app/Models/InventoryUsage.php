<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class InventoryUsage extends Model
{
    use HasFactory;

    protected $fillable = [
        'inventory_item_id',
        'usable_type',
        'usable_id',
        'quantity',
        'unit_price',
    ];

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function usable(): MorphTo
    {
        return $this->morphTo();
    }
}
