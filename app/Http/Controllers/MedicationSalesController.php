<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\Pet;
use App\Models\PetPayment;
use App\Models\PetPaymentItem;
use App\Http\Traits\ScopesToTenant;
use App\Services\InventoryUsageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MedicationSalesController extends Controller
{
    use ScopesToTenant;

    public function index(): Response
    {
        $pets = $this->scopePetToUser(Pet::with('owner'))
            ->orderBy('name')
            ->get()
            ->map(fn ($pet) => [
                'id' => $pet->id,
                'name' => $pet->name,
                'ownerName' => $pet->owner?->name ?? 'Unknown',
            ]);

        $inventoryItems = $this->scopeToUser(
            InventoryItem::with('category')
                ->whereHas('category', fn ($query) => $query->where('slug', '<>', 'vaccination'))
                ->where('current_stock', '>', 0)
                ->orderBy('name')
        )
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'brand' => $item->brand ?? '',
                'batchNumber' => $item->batch_number ?? '',
                'currentStock' => (int) $item->current_stock,
                'unitPrice' => (float) $item->unit_price,
                'expiryDate' => $item->expiry_date?->toDateString(),
                'categoryName' => $item->category?->name ?? 'Inventory',
            ]);

        return Inertia::render('medication-sales', [
            'pets' => $pets,
            'inventoryItems' => $inventoryItems,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'pet_id' => 'nullable|integer|exists:pets,pet_id',
            'customer_name' => 'required_without:pet_id|string|max:255',
            'notes' => 'nullable|string|max:1000',
            'inventory_items' => 'required|array|min:1',
            'inventory_items.*.inventory_item_id' => 'required|integer|distinct',
            'inventory_items.*.quantity' => 'required|integer|min:1',
        ]);

        $pet = null;
        if (! empty($validated['pet_id'])) {
            $pet = $this->scopePetToUser(Pet::where('pet_id', $validated['pet_id']))->first();
            if (! $pet) {
                return back()->withErrors(['pet_id' => 'Selected pet not found or not accessible.']);
            }
        }

        $inventoryItemsInput = $validated['inventory_items'];
        $inventoryItemIds = collect($inventoryItemsInput)->pluck('inventory_item_id')->all();

        $inventoryItems = InventoryItem::with('category')
            ->whereIn('inventory_item_id', $inventoryItemIds)
            ->get()
            ->keyBy('id');

        $saleItems = [];
        $totalAmount = 0;

        foreach ($inventoryItemsInput as $index => $itemInput) {
            $inventoryItemId = $itemInput['inventory_item_id'];
            $quantity = (int) $itemInput['quantity'];

            $inventoryItem = $inventoryItems->get($inventoryItemId);
            if (! $inventoryItem || $inventoryItem->category?->slug === 'vaccination') {
                return back()->withErrors(["inventory_items.{$index}.inventory_item_id" => 'Selected item is not available for sale or is unavailable.']);
            }

            $saleItems[] = [
                'inventory_item_id' => $inventoryItem->id,
                'quantity' => $quantity,
                'unit_price' => $inventoryItem->unit_price,
            ];

            $totalAmount += $inventoryItem->unit_price * $quantity;
        }

        if ($totalAmount <= 0) {
            return back()->withErrors(['inventory_items' => 'At least one product must be selected to create a sale.']);
        }

        DB::transaction(function () use ($pet, $saleItems, $totalAmount, $validated) {
            $payment = PetPayment::create([
                'pet_id' => $pet?->id,
                'customer_name' => $validated['customer_name'] ?? null,
                'total_amount' => $totalAmount,
                'status' => 'pending',
                'notes' => $validated['notes'] ?? null,
                'recorded_by' => auth()->id(),
            ]);

            foreach ($saleItems as $saleItem) {
                $inventoryItem = InventoryItem::find($saleItem['inventory_item_id']);

                PetPaymentItem::create([
                    'pet_payment_id' => $payment->id,
                    'service_type' => 'inventory_item',
                    'service_id' => $inventoryItem->id,
                    'description' => $inventoryItem->name . ' x' . $saleItem['quantity'],
                    'amount' => $inventoryItem->unit_price * $saleItem['quantity'],
                ]);
            }

            app(InventoryUsageService::class)->attach($payment, $saleItems);
        });

        return redirect()->route('medication-sales')->with('success', 'Inventory sale created successfully and inventory stock updated.');
    }
}
