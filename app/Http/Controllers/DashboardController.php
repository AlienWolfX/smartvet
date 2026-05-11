<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use App\Models\Owner;
use App\Models\Consultation;
use App\Models\Vaccination;
use App\Models\PetPayment;
use App\Models\InventoryItem;
use App\Http\Traits\ScopesToTenant;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    use ScopesToTenant;
    public function index()
    {
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();
        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();
        $lastMonthEnd = Carbon::now()->subMonth()->endOfMonth();

        // Daily revenue stats
        $todayRevenue = $this->scopePetPaymentToUser(PetPayment::query()->where('status', 'paid')
            ->whereDate('paid_at', $today))
            ->sum('total_amount');

        $yesterdayRevenue = $this->scopePetPaymentToUser(PetPayment::query()->where('status', 'paid')
            ->whereDate('paid_at', $yesterday))
            ->sum('total_amount');

        $todayInvoices = $this->scopePetPaymentToUser(PetPayment::query()->whereDate('created_at', $today))->count();

        // Monthly revenue
        $thisMonthRevenue = $this->scopePetPaymentToUser(PetPayment::query()->where('status', 'paid')
            ->whereDate('paid_at', '>=', $thisMonth))
            ->sum('total_amount');

        $lastMonthRevenue = $this->scopePetPaymentToUser(PetPayment::query()->where('status', 'paid')
            ->whereDate('paid_at', '>=', $lastMonth)
            ->whereDate('paid_at', '<=', $lastMonthEnd))
            ->sum('total_amount');

        // Pending/Outstanding payments
        $pendingAmount = $this->scopePetPaymentToUser(PetPayment::query()->where('status', 'pending'))->sum('total_amount');
        $pendingCount = $this->scopePetPaymentToUser(PetPayment::query()->where('status', 'pending'))->count();

        // Today's patients/consultations
        $todayConsultations = $this->scopeThroughPetOwner(Consultation::query()->whereDate('consultation_date', $today))->count();
        $yesterdayConsultations = $this->scopeThroughPetOwner(Consultation::query()->whereDate('consultation_date', $yesterday))->count();
        $lastMonthConsultations = $this->scopeThroughPetOwner(Consultation::query()->whereDate('consultation_date', '>=', $lastMonth)->whereDate('consultation_date', '<=', $lastMonthEnd))->count();

        // Vaccinations counts
        $presentMonthlyVaccinations = $this->scopeThroughPetOwner(Vaccination::query()->whereDate('vaccination_date', '>=', $thisMonth)->whereDate('vaccination_date', '<=', Carbon::now()))->count();
        $previousMonthlyVaccinations = $this->scopeThroughPetOwner(Vaccination::query()->whereDate('vaccination_date', '>=', $lastMonth)->whereDate('vaccination_date', '<=', $lastMonthEnd))->count();

        // Present month consultations
        $presentMonthlyConsultations = $this->scopeThroughPetOwner(Consultation::query()->whereDate('consultation_date', '>=', $thisMonth)->whereDate('consultation_date', '<=', Carbon::now()))->count();

        // Total pets and owners
        $totalPets = $this->scopePetToUser(Pet::query())->count();
        $totalOwners = $this->scopeToUser(Owner::query())->count();
        $activePets = $this->scopePetToUser(Pet::query()->where('status', 'active'))->count();

        // Recent transactions
        $recentPayments = $this->scopePetPaymentToUser(PetPayment::query()->with(['pet', 'pet.owner', 'items']))
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($payment) {
                $serviceDescription = $payment->items->count()
                    ? $payment->items->pluck('description')->join(', ')
                    : ($payment->customer_name ? 'Walk-in sale' : 'Clinic services');

                return [
                    'paymentId' => $payment->getKey(),
                    'id' => 'TX-' . str_pad($payment->getKey(), 5, '0', STR_PAD_LEFT),
                    'client' => $payment->pet?->owner?->name ?? $payment->customer_name ?? 'Walk-in Customer',
                    'pet' => $payment->pet
                        ? ($payment->pet->name . ' • ' . ($payment->pet->species?->name ?? 'Pet'))
                        : 'Walk-in',
                    'service' => $serviceDescription,
                    'amount' => (float) $payment->total_amount,
                    'status' => $this->mapPaymentStatus($payment->status),
                    'date' => $payment->created_at->format('M d, Y • g:i A'),
                ];
            });

        // Service breakdown (by consultation type + walk-in sales)
        $consultationBreakdown = $this->scopeThroughPetOwner(Consultation::query()->whereDate('consultation_date', '>=', $thisMonth))
            ->selectRaw('consultation_type, COUNT(*) as cases, SUM(consultation_fee) as revenue')
            ->groupBy('consultation_type')
            ->get()
            ->map(function ($item, $index) {
                $colors = ['#10b981', '#0ea5e9', '#f97316', '#8b5cf6', '#ef4444'];
                return [
                    'name' => ucfirst(str_replace('_', ' ', $item->consultation_type ?? 'General')),
                    'cases' => $item->cases . ' cases',
                    'revenue' => (float) ($item->revenue ?? 0),
                    'trend' => 'This month',
                    'color' => $colors[$index % count($colors)],
                ];
            });

        $walkInRevenue = $this->scopePetPaymentToUser(PetPayment::query()
            ->whereNull('pet_id')
            ->where('status', 'paid')
            ->whereDate('created_at', '>=', $thisMonth)
        )->sum('total_amount');

        if ($walkInRevenue > 0) {
            $consultationBreakdown->push([
                'name' => 'Walk-in Sales',
                'cases' => 'Walk-in',
                'revenue' => (float) $walkInRevenue,
                'trend' => 'This month',
                'color' => '#f59e0b',
            ]);
        }

        // Low stock alerts
        $lowStockCount = $this->scopeToUser(InventoryItem::query()->where(function ($query) {
            $query->whereColumn('current_stock', '<=', 'min_stock')
                ->orWhere('current_stock', 0);
        }))->count();

        // Upcoming vaccinations
        $upcomingVaccinations = $this->scopeThroughPetOwner(Vaccination::query()->whereNotNull('next_due_date')
            ->where('next_due_date', '<=', Carbon::now()->addDays(7)))
            ->count();

        // Calculate percentage changes
        $revenueChange = $yesterdayRevenue > 0
            ? round((($todayRevenue - $yesterdayRevenue) / $yesterdayRevenue) * 100, 1)
            : ($todayRevenue > 0 ? 100 : 0);

        $consultationChange = $yesterdayConsultations > 0
            ? $todayConsultations - $yesterdayConsultations
            : $todayConsultations;

        return Inertia::render('dashboard', [
            'stats' => [
                'patientsToday' => [
                    'value' => $todayConsultations,
                    'change' => $consultationChange,
                    'changeText' => ($consultationChange >= 0 ? '+' : '') . $consultationChange . ' vs yesterday',
                    'trend' => $consultationChange >= 0 ? 'up' : 'down',
                    'meta' => 'Today consultation count',
                ],
                'presentMonthlyVaccinations' => [
                    'value' => $presentMonthlyVaccinations,
                    'change' => $presentMonthlyVaccinations - $previousMonthlyVaccinations,
                    'changeText' => ($presentMonthlyVaccinations - $previousMonthlyVaccinations >= 0 ? '+' : '') . ($presentMonthlyVaccinations - $previousMonthlyVaccinations) . ' vs last month',
                    'trend' => $presentMonthlyVaccinations >= $previousMonthlyVaccinations ? 'up' : 'down',
                    'meta' => 'This month vaccinations',
                ],
                'previousMonthlyVaccinations' => [
                    'value' => $previousMonthlyVaccinations,
                    'changeText' => 'Last month total',
                    'trend' => 'up',
                    'meta' => 'Previous month vaccinations',
                ],
                'presentMonthlyConsultations' => [
                    'value' => $presentMonthlyConsultations,
                    'change' => $presentMonthlyConsultations - ($lastMonthConsultations ?? 0),
                    'changeText' => (($presentMonthlyConsultations - ($lastMonthConsultations ?? 0)) >= 0 ? '+' : '') . abs($presentMonthlyConsultations - ($lastMonthConsultations ?? 0)) . ' vs last month',
                    'trend' => $presentMonthlyConsultations >= ($lastMonthConsultations ?? 0) ? 'up' : 'down',
                    'meta' => 'This month consultations',
                ],
                'totalPets' => $totalPets,
                'totalOwners' => $totalOwners,
                'activePets' => $activePets,
                'lowStockCount' => $lowStockCount,
                'upcomingVaccinations' => $upcomingVaccinations,
            ],
            'recentTransactions' => $recentPayments,
            'serviceHighlights' => $consultationBreakdown->isEmpty()
                ? $this->getDefaultServiceHighlights()
                : $consultationBreakdown,
        ]);
    }

    private function mapPaymentStatus(string $status): string
    {
        return match($status) {
            'paid' => 'Cleared',
            'pending' => 'Pending',
            'cancelled', 'refunded' => 'Flagged',
            default => 'Pending',
        };
    }

    private function getDefaultServiceHighlights(): array
    {
        return [
            [
                'name' => 'Consultations',
                'cases' => '0 cases',
                'revenue' => 0,
                'trend' => 'This month',
                'color' => '#10b981',
            ],
            [
                'name' => 'Vaccinations',
                'cases' => '0 scheduled',
                'revenue' => 0,
                'trend' => 'This month',
                'color' => '#0ea5e9',
            ],
            [
                'name' => 'Treatments',
                'cases' => '0 completed',
                'revenue' => 0,
                'trend' => 'This month',
                'color' => '#f97316',
            ],
        ];
    }
}
