<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DismissedNotification extends Model
{
    use HasAliasedPrimaryKey;

    public $timestamps = false;

    protected $primaryKey = 'dismissed_notification_id';

    protected $fillable = [
        'user_id',
        'inventory_item_id',
        'notification_type',
        'dismissed_at',
    ];

    protected $casts = [
        'dismissed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class, 'inventory_item_id', 'inventory_item_id');
    }
}
