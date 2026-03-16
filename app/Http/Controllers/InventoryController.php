<?php

namespace App\Http\Controllers;

use App\Models\InventoryCategory;
use App\Models\InventoryItem;
use App\Http\Traits\ScopesToTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    use ScopesToTenant;

    private const HIDDEN_CATEGORY_SLUGS = ['vaccination'];

    public function index(): Response
    {
        $categories = InventoryCategory::whereNotIn('slug', self::HIDDEN_CATEGORY_SLUGS)
            ->orderBy('name')
            ->get();
        $items = $this->scopeToUser(
            InventoryItem::with('category')
                ->whereHas('category', function ($query) {
                    $query->whereNotIn('slug', self::HIDDEN_CATEGORY_SLUGS);
                })
        )
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('inventory-management', [
            'categories' => $categories->map(fn ($category) => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'icon' => $category->icon,
            ]),
            'items' => $items->map(fn ($item) => [
                'dbId' => $item->id,
                'id' => $item->item_code,
                'name' => $item->name,
                'brand' => $item->brand ?? '',
                'batchNumber' => $item->batch_number ?? '',
                'categoryId' => $item->category?->id ?? 0,
                'categorySlug' => $item->category?->slug ?? '',
                'categoryName' => $item->category?->name ?? 'Uncategorized',
                'currentStock' => (int) $item->current_stock,
                'minStock' => (int) $item->min_stock,
                'maxStock' => (int) $item->max_stock,
                'unitPrice' => (float) $item->unit_price,
                'expiryDate' => $item->expiry_date?->toDateString(),
                'supplier' => $item->supplier,
                'location' => $item->location,
                'description' => $item->description,
                'lastRestocked' => $item->last_restocked_at?->toDateString(),
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'brand' => 'nullable|string|max:255',
            'batch_number' => 'nullable|string|max:255',
            'inventory_category_id' => [
                'required',
                Rule::exists('inventory_categories', 'id')->where(function ($query) {
                    $query->whereNotIn('slug', self::HIDDEN_CATEGORY_SLUGS);
                }),
            ],
            'current_stock' => 'required|integer|min:0',
            'min_stock' => 'required|integer|min:0',
            'max_stock' => 'required|integer|min:0',
            'unit_price' => 'required|numeric|min:0',
            'expiry_date' => 'nullable|date',
            'supplier' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        if ($validated['max_stock'] < $validated['min_stock']) {
            return back()->withErrors(['max_stock' => 'Max stock must be greater than or equal to min stock'])->withInput();
        }

        DB::transaction(function () use ($validated) {
            $nextNumber = (InventoryItem::max('id') ?? 0) + 1;
            $code = 'INV-' . str_pad((string) $nextNumber, 4, '0', STR_PAD_LEFT);

            InventoryItem::create([
                'user_id' => $this->tenantUserId(),
                'item_code' => $code,
                'inventory_category_id' => $validated['inventory_category_id'],
                'name' => $validated['name'],
                'brand' => $validated['brand'] ?? null,
                'batch_number' => $validated['batch_number'] ?? null,
                'current_stock' => $validated['current_stock'],
                'min_stock' => $validated['min_stock'],
                'max_stock' => $validated['max_stock'],
                'unit_price' => $validated['unit_price'],
                'expiry_date' => $validated['expiry_date'] ?? null,
                'supplier' => $validated['supplier'] ?? null,
                'location' => $validated['location'] ?? null,
                'description' => $validated['description'] ?? null,
                'last_restocked_at' => now(),
            ]);
        });

        return redirect()->back()->with('success', 'Inventory item added successfully!');
    }

    public function update(Request $request, InventoryItem $item): RedirectResponse
    {
        // Verify ownership
        $user = auth()->user();
        if (!$user->isAdmin() && $item->user_id !== $user->id) {
            abort(403);
        }

        if (in_array($item->category?->slug, self::HIDDEN_CATEGORY_SLUGS, true)) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'brand' => 'nullable|string|max:255',
            'batch_number' => 'nullable|string|max:255',
            'inventory_category_id' => [
                'required',
                Rule::exists('inventory_categories', 'id')->where(function ($query) {
                    $query->whereNotIn('slug', self::HIDDEN_CATEGORY_SLUGS);
                }),
            ],
            'current_stock' => 'required|integer|min:0',
            'min_stock' => 'required|integer|min:0',
            'max_stock' => 'required|integer|min:0',
            'unit_price' => 'required|numeric|min:0',
            'expiry_date' => 'nullable|date',
            'supplier' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        if ($validated['max_stock'] < $validated['min_stock']) {
            return back()->withErrors(['max_stock' => 'Max stock must be greater than or equal to min stock'])->withInput();
        }

        $item->update([
            'inventory_category_id' => $validated['inventory_category_id'],
            'name' => $validated['name'],
            'brand' => $validated['brand'] ?? null,
            'batch_number' => $validated['batch_number'] ?? null,
            'current_stock' => $validated['current_stock'],
            'min_stock' => $validated['min_stock'],
            'max_stock' => $validated['max_stock'],
            'unit_price' => $validated['unit_price'],
            'expiry_date' => $validated['expiry_date'] ?? null,
            'supplier' => $validated['supplier'] ?? null,
            'location' => $validated['location'] ?? null,
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Inventory item updated successfully!');
    }

    public function restock(Request $request, InventoryItem $item): RedirectResponse
    {
        // Verify ownership
        $user = auth()->user();
        if (!$user->isAdmin() && $item->user_id !== $user->id) {
            abort(403);
        }

        if (in_array($item->category?->slug, self::HIDDEN_CATEGORY_SLUGS, true)) {
            abort(404);
        }

        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'nullable|numeric|min:0',
            'expiry_date' => 'nullable|date',
        ]);

        DB::transaction(function () use ($validated, $item) {
            $item->increment('current_stock', $validated['quantity']);
            $item->last_restocked_at = now();

            if (array_key_exists('unit_price', $validated) && $validated['unit_price'] !== null) {
                $item->unit_price = $validated['unit_price'];
            }

            if (!empty($validated['expiry_date'])) {
                $item->expiry_date = $validated['expiry_date'];
            }

            $item->save();
        });

        return redirect()->back()->with('success', 'Inventory updated with new stock!');
    }

    public function destroy(InventoryItem $item): RedirectResponse
    {
        // Verify ownership
        $user = auth()->user();
        if (!$user->isAdmin() && $item->user_id !== $user->id) {
            abort(403);
        }

        if (in_array($item->category?->slug, self::HIDDEN_CATEGORY_SLUGS, true)) {
            abort(404);
        }

        $item->delete();

        return redirect()->back()->with('success', 'Inventory item deleted successfully!');
    }

    public function export(Request $request)
    {
        $request->validate([
            'category' => ['nullable', 'string'],
            'status' => ['nullable', 'in:all,in-stock,low-stock,out-of-stock'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $itemsQuery = $this->scopeToUser(
            InventoryItem::with('category')
                ->whereHas('category', function ($query) {
                    $query->whereNotIn('slug', self::HIDDEN_CATEGORY_SLUGS);
                })
        )
            ->orderBy('name');

        $category = $request->string('category')->toString();
        if ($category && $category !== 'all') {
            $itemsQuery->whereHas('category', function ($query) use ($category) {
                $query->where('slug', $category);
            });
        }

        $status = $request->string('status')->toString();
        if ($status && $status !== 'all') {
            if ($status === 'out-of-stock') {
                $itemsQuery->where('current_stock', 0);
            } elseif ($status === 'low-stock') {
                $itemsQuery->where('current_stock', '>', 0)
                    ->whereColumn('current_stock', '<=', 'min_stock');
            } elseif ($status === 'in-stock') {
                $itemsQuery->whereColumn('current_stock', '>', 'min_stock');
            }
        }

        if ($request->filled('date_from')) {
            $itemsQuery->whereDate('created_at', '>=', $request->date('date_from'));
        }

        if ($request->filled('date_to')) {
            $itemsQuery->whereDate('created_at', '<=', $request->date('date_to'));
        }

        $items = $itemsQuery->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Inventory');

        $headers = [
            'Item Code',
            'Name',
            'Brand',
            'Category',
            'Current Stock',
            'Min Stock',
            'Max Stock',
            'Unit Price',
            'Status',
            'Supplier',
            'Location',
            'Expiry Date',
            'Last Restocked',
        ];

        foreach ($headers as $index => $header) {
            $columnLetter = Coordinate::stringFromColumnIndex($index + 1);
            $sheet->setCellValue("{$columnLetter}1", $header);
        }

        $row = 2;
        foreach ($items as $item) {
            $statusLabel = 'in-stock';
            if ($item->current_stock === 0) {
                $statusLabel = 'out-of-stock';
            } elseif ($item->current_stock <= $item->min_stock) {
                $statusLabel = 'low-stock';
            }

            $sheet->setCellValue("A{$row}", $item->item_code);
            $sheet->setCellValue("B{$row}", $item->name);
            $sheet->setCellValue("C{$row}", $item->brand);
            $sheet->setCellValue("D{$row}", $item->category?->name ?? 'Uncategorized');
            $sheet->setCellValue("E{$row}", $item->current_stock);
            $sheet->setCellValue("F{$row}", $item->min_stock);
            $sheet->setCellValue("G{$row}", $item->max_stock);
            $sheet->setCellValue("H{$row}", $item->unit_price);
            $sheet->setCellValue("I{$row}", $statusLabel);
            $sheet->setCellValue("J{$row}", $item->supplier ?? '');
            $sheet->setCellValue("K{$row}", $item->location ?? '');
            $sheet->setCellValue("L{$row}", optional($item->expiry_date)->toDateString());
            $sheet->setCellValue("M{$row}", optional($item->last_restocked_at)->toDateString());
            $row++;
        }

        foreach (range('A', 'M') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $fileName = 'inventory-export-' . now()->format('Ymd_His') . '.xlsx';
        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}
