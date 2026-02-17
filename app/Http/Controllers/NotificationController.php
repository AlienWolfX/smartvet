<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Http\Traits\ScopesToTenant;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    use ScopesToTenant;
    public function index(): JsonResponse
    {
        $today = Carbon::today();
        $thirtyDaysFromNow = Carbon::today()->addDays(30);

        // Expired items
        $expired = $this->scopeToUser(InventoryItem::with('category')
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<', $today))
            ->orderBy('expiry_date')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'type' => 'expired',
                'name' => $item->name,
                'brand' => $item->brand,
                'itemCode' => $item->item_code,
                'category' => $item->category?->name ?? 'Uncategorized',
                'expiryDate' => $item->expiry_date->format('M d, Y'),
                'daysAgo' => $today->diffInDays($item->expiry_date),
                'message' => 'Expired ' . $today->diffInDays($item->expiry_date) . ' day(s) ago',
            ]);

        // Expiring soon (within 30 days)
        $expiringSoon = $this->scopeToUser(InventoryItem::with('category')
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '>=', $today)
            ->where('expiry_date', '<=', $thirtyDaysFromNow))
            ->orderBy('expiry_date')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'type' => 'expiring_soon',
                'name' => $item->name,
                'brand' => $item->brand,
                'itemCode' => $item->item_code,
                'category' => $item->category?->name ?? 'Uncategorized',
                'expiryDate' => $item->expiry_date->format('M d, Y'),
                'daysLeft' => $today->diffInDays($item->expiry_date),
                'message' => 'Expires in ' . $today->diffInDays($item->expiry_date) . ' day(s)',
            ]);

        // Out of stock
        $outOfStock = $this->scopeToUser(InventoryItem::with('category')
            ->where('current_stock', 0))
            ->orderBy('name')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'type' => 'out_of_stock',
                'name' => $item->name,
                'brand' => $item->brand,
                'itemCode' => $item->item_code,
                'category' => $item->category?->name ?? 'Uncategorized',
                'currentStock' => 0,
                'minStock' => $item->min_stock,
                'message' => 'Out of stock',
            ]);

        // Low stock (at or below min_stock, but not zero)
        $lowStock = $this->scopeToUser(InventoryItem::with('category')
            ->where('current_stock', '>', 0)
            ->whereColumn('current_stock', '<=', 'min_stock'))
            ->orderByRaw('current_stock / min_stock ASC')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'type' => 'low_stock',
                'name' => $item->name,
                'brand' => $item->brand,
                'itemCode' => $item->item_code,
                'category' => $item->category?->name ?? 'Uncategorized',
                'currentStock' => $item->current_stock,
                'minStock' => $item->min_stock,
                'message' => "Only {$item->current_stock} left (min: {$item->min_stock})",
            ]);

        $totalCount = $expired->count() + $expiringSoon->count() + $outOfStock->count() + $lowStock->count();

        return response()->json([
            'totalCount' => $totalCount,
            'expired' => $expired->values(),
            'expiringSoon' => $expiringSoon->values(),
            'outOfStock' => $outOfStock->values(),
            'lowStock' => $lowStock->values(),
        ]);
    }
}
