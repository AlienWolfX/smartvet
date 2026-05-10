<?php

namespace App\Services;

use App\Models\InventoryItem;
use App\Models\InventoryUsage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class InventoryUsageService
{
    /**
     * @param  iterable<int, array<string, mixed>>  $items
     */
    public function attach(Model $usable, iterable $items): void
    {
        $items = $items instanceof Collection ? $items : collect($items);

        if ($items->isEmpty()) {
            return;
        }

        foreach ($items as $item) {
            if (empty($item['inventory_item_id'])) {
                continue;
            }

            $quantity = (int) ($item['quantity'] ?? 0);
            if ($quantity <= 0) {
                continue;
            }

            $inventoryItem = InventoryItem::lockForUpdate()->find($item['inventory_item_id']);
            if (! $inventoryItem) {
                continue;
            }

            if ($inventoryItem->current_stock < $quantity) {
                throw ValidationException::withMessages([
                    'inventory_items' => "Not enough stock for {$inventoryItem->name}. Available: {$inventoryItem->current_stock}",
                ]);
            }

            $inventoryItem->decrement('current_stock', $quantity);

            InventoryUsage::create([
                'inventory_item_id' => $inventoryItem->getKey(),
                'usable_type' => $usable::class,
                'usable_id' => $usable->getKey(),
                'quantity' => $quantity,
                'unit_price' => $item['unit_price'] ?? $inventoryItem->unit_price,
            ]);
        }
    }
}
