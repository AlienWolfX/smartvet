<?php

namespace App\Services;

use App\Models\Pet;
use App\Models\Owner;
use App\Models\InventoryItem;
use App\Models\InventoryCategory;
use App\Models\Consultation;
use App\Models\Vaccination;
use App\Models\PetPayment;
use App\Models\User;
use App\Models\AiConfiguration;
use Illuminate\Support\Facades\DB;

class AiAssistantService
{
    protected ?AiConfiguration $config = null;

    /**
     * Get the AI configuration
     */
    public function getConfig(): AiConfiguration
    {
        if (!$this->config) {
            $this->config = AiConfiguration::getOrCreateDefault();
        }
        return $this->config;
    }

    /**
     * Get comprehensive database context for the AI
     */
    public function getDatabaseContext(): array
    {
        return [
            'inventory_summary' => $this->getInventorySummary(),
            'inventory_by_category' => $this->getInventoryByCategory(),
            'pet_statistics' => $this->getPetStatistics(),
            'recent_consultations' => $this->getRecentConsultations(),
            'financial_summary' => $this->getFinancialSummary(),
            'low_stock_items' => $this->getLowStockItems(),
            'upcoming_vaccinations' => $this->getUpcomingVaccinations(),
        ];
    }

    /**
     * Get inventory summary
     */
    public function getInventorySummary(): array
    {
        $totalItems = InventoryItem::count();
        $lowStock = InventoryItem::whereColumn('current_stock', '<=', 'min_stock')
            ->where('current_stock', '>', 0)
            ->count();
        $outOfStock = InventoryItem::where('current_stock', 0)->count();
        $totalValue = InventoryItem::selectRaw('SUM(current_stock * unit_price) as total')
            ->first()->total ?? 0;

        $categories = InventoryCategory::withCount('items')->get()->map(fn($cat) => [
            'name' => $cat->name,
            'item_count' => $cat->items_count,
        ])->toArray();

        return [
            'total_items' => $totalItems,
            'low_stock_count' => $lowStock,
            'out_of_stock_count' => $outOfStock,
            'total_inventory_value' => number_format($totalValue, 2),
            'categories' => $categories,
        ];
    }

    /**
     * Get all inventory items grouped by category
     */
    public function getAllInventoryItems(): array
    {
        return InventoryItem::with('category')
            ->orderBy('name')
            ->get()
            ->map(fn($item) => [
                'name' => $item->name,
                'category' => $item->category?->name ?? 'Uncategorized',
                'current_stock' => $item->current_stock,
                'unit_price' => number_format($item->unit_price, 2),
            ])
            ->toArray();
    }

    /**
     * Get inventory items grouped by category
     */
    public function getInventoryByCategory(): array
    {
        $items = InventoryItem::with('category')
            ->orderBy('name')
            ->get();

        $grouped = [];
        foreach ($items as $item) {
            $categoryName = $item->category?->name ?? 'Uncategorized';
            if (!isset($grouped[$categoryName])) {
                $grouped[$categoryName] = [];
            }
            $grouped[$categoryName][] = [
                'name' => $item->name,
                'current_stock' => $item->current_stock,
                'unit_price' => number_format($item->unit_price, 2),
            ];
        }

        return $grouped;
    }

    /**
     * Get pet statistics
     */
    public function getPetStatistics(): array
    {
        $totalPets = Pet::count();
        $activePets = Pet::where('status', 'active')->count();
        $totalOwners = Owner::count();
        
        $speciesDistribution = Pet::join('pet_species', 'pets.species_id', '=', 'pet_species.id')
            ->selectRaw('pet_species.name, COUNT(*) as count')
            ->groupBy('pet_species.id', 'pet_species.name')
            ->get()
            ->toArray();

        $recentPets = Pet::with(['owner', 'species'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($pet) => [
                'name' => $pet->name,
                'species' => $pet->species?->name ?? 'Unknown',
                'breed' => $pet->breed,
                'owner' => $pet->owner?->name ?? 'Unknown',
                'registered' => $pet->created_at->format('M d, Y'),
            ])
            ->toArray();

        return [
            'total_pets' => $totalPets,
            'active_pets' => $activePets,
            'total_owners' => $totalOwners,
            'species_distribution' => $speciesDistribution,
            'recent_registrations' => $recentPets,
        ];
    }

    /**
     * Get recent consultations
     */
    public function getRecentConsultations(): array
    {
        return Consultation::with(['pet', 'pet.owner'])
            ->orderBy('consultation_date', 'desc')
            ->limit(10)
            ->get()
            ->map(fn($consultation) => [
                'pet_name' => $consultation->pet?->name ?? 'Unknown',
                'owner_name' => $consultation->pet?->owner?->name ?? 'Unknown',
                'type' => $consultation->consultation_type,
                'diagnosis' => $consultation->diagnosis,
                'date' => $consultation->consultation_date?->format('M d, Y'),
                'status' => $consultation->status,
                'veterinarian' => $consultation->veterinarian,
            ])
            ->toArray();
    }

    /**
     * Get financial summary
     */
    public function getFinancialSummary(): array
    {
        $today = now()->toDateString();
        $thisMonth = now()->startOfMonth()->toDateString();
        $thisYear = now()->startOfYear()->toDateString();

        $todayRevenue = PetPayment::where('status', 'paid')
            ->whereDate('paid_at', $today)
            ->sum('total_amount');

        $monthRevenue = PetPayment::where('status', 'paid')
            ->whereDate('paid_at', '>=', $thisMonth)
            ->sum('total_amount');

        $yearRevenue = PetPayment::where('status', 'paid')
            ->whereDate('paid_at', '>=', $thisYear)
            ->sum('total_amount');

        $pendingPayments = PetPayment::where('status', 'pending')->count();
        $pendingAmount = PetPayment::where('status', 'pending')->sum('total_amount');

        return [
            'today_revenue' => number_format($todayRevenue, 2),
            'month_revenue' => number_format($monthRevenue, 2),
            'year_revenue' => number_format($yearRevenue, 2),
            'pending_payments_count' => $pendingPayments,
            'pending_amount' => number_format($pendingAmount, 2),
        ];
    }

    /**
     * Get low stock items
     */
    public function getLowStockItems(): array
    {
        return InventoryItem::with('category')
            ->where(function ($query) {
                $query->whereColumn('current_stock', '<=', 'min_stock')
                    ->orWhere('current_stock', 0);
            })
            ->orderBy('current_stock')
            ->limit(10)
            ->get()
            ->map(fn($item) => [
                'name' => $item->name,
                'category' => $item->category?->name ?? 'Uncategorized',
                'current_stock' => $item->current_stock,
                'min_stock' => $item->min_stock,
                'status' => $item->current_stock === 0 ? 'Out of Stock' : 'Low Stock',
            ])
            ->toArray();
    }

    /**
     * Get upcoming vaccinations (due soon or overdue)
     */
    public function getUpcomingVaccinations(): array
    {
        $thirtyDaysFromNow = now()->addDays(30)->toDateString();
        
        return Vaccination::with(['pet', 'pet.owner'])
            ->whereNotNull('next_due_date')
            ->where('next_due_date', '<=', $thirtyDaysFromNow)
            ->orderBy('next_due_date')
            ->limit(10)
            ->get()
            ->map(fn($vax) => [
                'pet_name' => $vax->pet?->name ?? 'Unknown',
                'owner_name' => $vax->pet?->owner?->name ?? 'Unknown',
                'vaccine_name' => $vax->vaccine_name,
                'due_date' => $vax->next_due_date?->format('M d, Y'),
                'is_overdue' => $vax->next_due_date?->isPast() ?? false,
            ])
            ->toArray();
    }

    /**
     * Search pets by name or owner
     */
    public function searchPets(string $query): array
    {
        return Pet::with(['owner', 'species'])
            ->where('name', 'like', "%{$query}%")
            ->orWhereHas('owner', fn($q) => $q->where('name', 'like', "%{$query}%"))
            ->limit(10)
            ->get()
            ->map(fn($pet) => [
                'id' => $pet->id,
                'name' => $pet->name,
                'species' => $pet->species?->name ?? 'Unknown',
                'breed' => $pet->breed,
                'age' => $pet->age,
                'gender' => $pet->gender,
                'owner_name' => $pet->owner?->name ?? 'Unknown',
                'owner_phone' => $pet->owner?->phone ?? 'N/A',
                'status' => $pet->status,
                'last_visit' => $pet->last_visit?->format('M d, Y') ?? 'Never',
            ])
            ->toArray();
    }

    /**
     * Search inventory items
     */
    public function searchInventory(string $query): array
    {
        return InventoryItem::with('category')
            ->where('name', 'like', "%{$query}%")
            ->orWhere('brand', 'like', "%{$query}%")
            ->orWhere('item_code', 'like', "%{$query}%")
            ->limit(10)
            ->get()
            ->map(fn($item) => [
                'id' => $item->id,
                'item_code' => $item->item_code,
                'name' => $item->name,
                'brand' => $item->brand,
                'category' => $item->category?->name ?? 'Uncategorized',
                'current_stock' => $item->current_stock,
                'min_stock' => $item->min_stock,
                'unit_price' => number_format($item->unit_price, 2),
                'expiry_date' => $item->expiry_date?->format('M d, Y') ?? 'N/A',
                'status' => $item->current_stock === 0 ? 'Out of Stock' : 
                           ($item->current_stock <= $item->min_stock ? 'Low Stock' : 'In Stock'),
            ])
            ->toArray();
    }

    /**
     * Get pet details by ID
     */
    public function getPetDetails(int $petId): ?array
    {
        $pet = Pet::with(['owner', 'species', 'consultations', 'vaccinations', 'medications'])
            ->find($petId);

        if (!$pet) {
            return null;
        }

        return [
            'basic_info' => [
                'name' => $pet->name,
                'species' => $pet->species?->name ?? 'Unknown',
                'breed' => $pet->breed,
                'age' => $pet->age,
                'weight' => $pet->weight,
                'gender' => $pet->gender,
                'color' => $pet->color,
                'microchip_id' => $pet->microchip_id ?? 'N/A',
                'status' => $pet->status,
            ],
            'owner_info' => [
                'name' => $pet->owner?->name ?? 'Unknown',
                'email' => $pet->owner?->email ?? 'N/A',
                'phone' => $pet->owner?->phone ?? 'N/A',
                'address' => $pet->owner?->address ?? 'N/A',
            ],
            'consultation_count' => $pet->consultations->count(),
            'vaccination_count' => $pet->vaccinations->count(),
            'recent_consultations' => $pet->consultations()
                ->orderBy('consultation_date', 'desc')
                ->limit(5)
                ->get()
                ->map(fn($c) => [
                    'type' => $c->consultation_type,
                    'diagnosis' => $c->diagnosis,
                    'date' => $c->consultation_date?->format('M d, Y'),
                ])
                ->toArray(),
            'vaccinations' => $pet->vaccinations()
                ->orderBy('vaccination_date', 'desc')
                ->limit(5)
                ->get()
                ->map(fn($v) => [
                    'vaccine' => $v->vaccine_name,
                    'date' => $v->vaccination_date?->format('M d, Y'),
                    'next_due' => $v->next_due_date?->format('M d, Y') ?? 'N/A',
                ])
                ->toArray(),
        ];
    }

    /**
     * Get all owners with their pets
     */
    public function getOwnersPetsList(): array
    {
        return Owner::with(['pets', 'pets.species'])
            ->orderBy('name')
            ->get()
            ->map(fn($owner) => [
                'owner_name' => $owner->name,
                'phone' => $owner->phone,
                'email' => $owner->email ?? 'N/A',
                'pets' => $owner->pets->map(fn($pet) => [
                    'name' => $pet->name,
                    'species' => $pet->species?->name ?? 'Unknown',
                    'breed' => $pet->breed ?? 'Mixed',
                    'age' => $pet->age,
                    'gender' => $pet->gender,
                    'status' => $pet->status,
                ])->toArray(),
            ])
            ->toArray();
    }

    /**
     * Build system prompt with database context
     */
    public function buildSystemPrompt(): string
    {
        $context = $this->getDatabaseContext();
        $config = $this->getConfig();

        // Build the context data for placeholders
        $contextData = [
            'inventory_data' => $this->buildInventorySection($context),
            'pet_statistics' => $this->buildPetStatisticsSection($context),
            'owners_and_pets' => $this->buildOwnersPetsSection(),
            'financial_summary' => $this->buildFinancialSection($context),
            'low_stock_alerts' => "## LOW STOCK ALERTS\n" . $this->formatLowStockItems($context['low_stock_items']),
            'upcoming_vaccinations' => "## UPCOMING VACCINATIONS (Due within 30 days)\n" . $this->formatUpcomingVaccinations($context['upcoming_vaccinations']),
        ];

        return $config->getFullSystemPrompt($contextData);
    }

    /**
     * Build inventory section for system prompt
     */
    private function buildInventorySection(array $context): string
    {
        $output = "## INVENTORY BY CATEGORY\n";
        $output .= $this->formatInventoryByCategory($context['inventory_by_category']);
        $output .= "\n\n## INVENTORY SUMMARY\n";
        $output .= "- Total Items: {$context['inventory_summary']['total_items']}\n";
        $output .= "- Low Stock: {$context['inventory_summary']['low_stock_count']}\n";
        $output .= "- Out of Stock: {$context['inventory_summary']['out_of_stock_count']}\n";
        $output .= "- Total Value: ₱{$context['inventory_summary']['total_inventory_value']}";
        return $output;
    }

    /**
     * Build pet statistics section for system prompt
     */
    private function buildPetStatisticsSection(array $context): string
    {
        $output = "## PET STATISTICS\n";
        $output .= "- Total Pets: {$context['pet_statistics']['total_pets']}\n";
        $output .= "- Active Pets: {$context['pet_statistics']['active_pets']}\n";
        $output .= "- Total Owners: {$context['pet_statistics']['total_owners']}";
        return $output;
    }

    /**
     * Build owners and pets section for system prompt
     */
    private function buildOwnersPetsSection(): string
    {
        $owners = $this->getOwnersPetsList();
        if (empty($owners)) {
            return "## OWNERS & PETS\nNo owners registered yet.";
        }

        $output = "## ALL OWNERS & THEIR PETS\n";
        foreach ($owners as $owner) {
            $output .= "### {$owner['owner_name']} (Phone: {$owner['phone']})\n";
            if (empty($owner['pets'])) {
                $output .= "  - No pets registered\n";
            } else {
                foreach ($owner['pets'] as $pet) {
                    $output .= "  - {$pet['name']} ({$pet['species']} - {$pet['breed']}, {$pet['age']} yrs, {$pet['gender']}, Status: {$pet['status']})\n";
                }
            }
        }
        return $output;
    }

    /**
     * Build financial section for system prompt
     */
    private function buildFinancialSection(array $context): string
    {
        $output = "## FINANCIAL SUMMARY\n";
        $output .= "- Today's Revenue: ₱{$context['financial_summary']['today_revenue']}\n";
        $output .= "- This Month: ₱{$context['financial_summary']['month_revenue']}\n";
        $output .= "- This Year: ₱{$context['financial_summary']['year_revenue']}\n";
        $output .= "- Pending Payments: {$context['financial_summary']['pending_payments_count']} (₱{$context['financial_summary']['pending_amount']})";
        return $output;
    }

    private function formatInventoryByCategory(array $grouped): string
    {
        if (empty($grouped)) {
            return "No items in inventory";
        }

        $output = [];
        foreach ($grouped as $category => $items) {
            $output[] = "### {$category}:";
            foreach ($items as $item) {
                $output[] = "- {$item['name']}: {$item['current_stock']} in stock, ₱{$item['unit_price']}/unit";
            }
        }

        return implode("\n", $output);
    }

    private function formatAllInventoryItems(array $items): string
    {
        if (empty($items)) {
            return "No items in inventory";
        }

        return collect($items)
            ->map(fn($item) => "- {$item['name']} ({$item['category']}): {$item['current_stock']} in stock, ₱{$item['unit_price']}/unit")
            ->join("\n");
    }

    private function formatLowStockItems(array $items): string
    {
        if (empty($items)) {
            return "- No items currently low on stock";
        }

        return collect($items)
            ->map(fn($item) => "- {$item['name']} ({$item['category']}): {$item['current_stock']}/{$item['min_stock']} - {$item['status']}")
            ->join("\n");
    }

    private function formatUpcomingVaccinations(array $vaccinations): string
    {
        if (empty($vaccinations)) {
            return "- No vaccinations due in the next 30 days";
        }

        return collect($vaccinations)
            ->map(fn($v) => "- {$v['pet_name']} (Owner: {$v['owner_name']}): {$v['vaccine_name']} - Due: {$v['due_date']}" . ($v['is_overdue'] ? ' [OVERDUE]' : ''))
            ->join("\n");
    }
}
