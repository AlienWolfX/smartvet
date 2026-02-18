<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\DismissedNotification;
use App\Http\Traits\ScopesToTenant;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    use ScopesToTenant;

    public function index(Request $request): JsonResponse
    {
        $today = Carbon::today();
        $thirtyDaysFromNow = Carbon::today()->addDays(30);
        $userId = $request->user()->id;

        // Get dismissed notification keys for this user
        $dismissed = DismissedNotification::where('user_id', $userId)
            ->get()
            ->map(fn ($d) => $d->inventory_item_id . ':' . $d->notification_type)
            ->toArray();

        $isDismissed = fn ($itemId, $type) => in_array($itemId . ':' . $type, $dismissed);

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
                'dismissed' => $isDismissed($item->id, 'expired'),
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
                'dismissed' => $isDismissed($item->id, 'expiring_soon'),
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
                'dismissed' => $isDismissed($item->id, 'out_of_stock'),
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
                'dismissed' => $isDismissed($item->id, 'low_stock'),
            ]);

        // Only count non-dismissed notifications
        $totalCount = $expired->where('dismissed', false)->count()
            + $expiringSoon->where('dismissed', false)->count()
            + $outOfStock->where('dismissed', false)->count()
            + $lowStock->where('dismissed', false)->count();

        return response()->json([
            'totalCount' => $totalCount,
            'expired' => $expired->values(),
            'expiringSoon' => $expiringSoon->values(),
            'outOfStock' => $outOfStock->values(),
            'lowStock' => $lowStock->values(),
        ]);
    }

    public function dismiss(Request $request): JsonResponse
    {
        $request->validate([
            'inventory_item_id' => 'required|integer|exists:inventory_items,id',
            'notification_type' => 'required|string|in:expired,expiring_soon,out_of_stock,low_stock',
        ]);

        DismissedNotification::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'inventory_item_id' => $request->inventory_item_id,
                'notification_type' => $request->notification_type,
            ],
            ['dismissed_at' => now()]
        );

        return response()->json(['success' => true]);
    }

    public function dismissAll(Request $request): JsonResponse
    {
        $today = Carbon::today();
        $thirtyDaysFromNow = Carbon::today()->addDays(30);
        $userId = $request->user()->id;

        // Gather all current notification items with their types
        $notifications = collect();

        $this->scopeToUser(InventoryItem::whereNotNull('expiry_date')
            ->where('expiry_date', '<', $today))
            ->get()
            ->each(fn ($item) => $notifications->push(['id' => $item->id, 'type' => 'expired']));

        $this->scopeToUser(InventoryItem::whereNotNull('expiry_date')
            ->where('expiry_date', '>=', $today)
            ->where('expiry_date', '<=', $thirtyDaysFromNow))
            ->get()
            ->each(fn ($item) => $notifications->push(['id' => $item->id, 'type' => 'expiring_soon']));

        $this->scopeToUser(InventoryItem::where('current_stock', 0))
            ->get()
            ->each(fn ($item) => $notifications->push(['id' => $item->id, 'type' => 'out_of_stock']));

        $this->scopeToUser(InventoryItem::where('current_stock', '>', 0)
            ->whereColumn('current_stock', '<=', 'min_stock'))
            ->get()
            ->each(fn ($item) => $notifications->push(['id' => $item->id, 'type' => 'low_stock']));

        foreach ($notifications as $notification) {
            DismissedNotification::updateOrCreate(
                [
                    'user_id' => $userId,
                    'inventory_item_id' => $notification['id'],
                    'notification_type' => $notification['type'],
                ],
                ['dismissed_at' => now()]
            );
        }

        return response()->json(['success' => true]);
    }
}
