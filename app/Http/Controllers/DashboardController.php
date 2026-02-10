<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use App\Models\Owner;
use App\Models\Consultation;
use App\Models\Vaccination;
use App\Models\PetPayment;
use App\Models\InventoryItem;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();
        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();
        $lastMonthEnd = Carbon::now()->subMonth()->endOfMonth();

        // Daily revenue stats
        $todayRevenue = PetPayment::where('status', 'paid')
            ->whereDate('paid_at', $today)
            ->sum('total_amount');

        $yesterdayRevenue = PetPayment::where('status', 'paid')
            ->whereDate('paid_at', $yesterday)
            ->sum('total_amount');

        $todayInvoices = PetPayment::whereDate('created_at', $today)->count();

        // Monthly revenue
        $thisMonthRevenue = PetPayment::where('status', 'paid')
            ->whereDate('paid_at', '>=', $thisMonth)
            ->sum('total_amount');

        $lastMonthRevenue = PetPayment::where('status', 'paid')
            ->whereDate('paid_at', '>=', $lastMonth)
            ->whereDate('paid_at', '<=', $lastMonthEnd)
            ->sum('total_amount');

        // Pending/Outstanding payments
        $pendingAmount = PetPayment::where('status', 'pending')->sum('total_amount');
        $pendingCount = PetPayment::where('status', 'pending')->count();

        // Today's patients/consultations
        $todayConsultations = Consultation::whereDate('consultation_date', $today)->count();
        $yesterdayConsultations = Consultation::whereDate('consultation_date', $yesterday)->count();

        // Total pets and owners
        $totalPets = Pet::count();
        $totalOwners = Owner::count();
        $activePets = Pet::where('status', 'active')->count();

        // Recent transactions
        $recentPayments = PetPayment::with(['pet', 'pet.owner'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($payment) {
                return [
                    'id' => 'TX-' . str_pad($payment->id, 5, '0', STR_PAD_LEFT),
                    'client' => $payment->pet?->owner?->name ?? 'Unknown',
                    'pet' => ($payment->pet?->name ?? 'Unknown') . ' • ' . ($payment->pet?->species?->name ?? 'Pet'),
                    'service' => $payment->description ?? 'Clinic Services',
                    'amount' => (float) $payment->total_amount,
                    'status' => $this->mapPaymentStatus($payment->status),
                ];
            });

        // Service breakdown (by consultation type)
        $consultationBreakdown = Consultation::whereDate('consultation_date', '>=', $thisMonth)
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

        // Low stock alerts
        $lowStockCount = InventoryItem::where(function ($query) {
            $query->whereColumn('current_stock', '<=', 'min_stock')
                ->orWhere('current_stock', 0);
        })->count();

        // Upcoming vaccinations
        $upcomingVaccinations = Vaccination::whereNotNull('next_due_date')
            ->where('next_due_date', '<=', Carbon::now()->addDays(7))
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
                'dailyGross' => [
                    'value' => $todayRevenue,
                    'change' => $revenueChange,
                    'changeText' => ($revenueChange >= 0 ? '+' : '') . $revenueChange . '% vs yesterday',
                    'trend' => $revenueChange >= 0 ? 'up' : 'down',
                    'meta' => $todayInvoices . ' invoices issued',
                ],
                'monthlyRevenue' => [
                    'value' => $thisMonthRevenue,
                    'change' => $thisMonthRevenue - $lastMonthRevenue,
                    'changeText' => '₱' . number_format(abs($thisMonthRevenue - $lastMonthRevenue)) . ' ' . ($thisMonthRevenue >= $lastMonthRevenue ? 'more' : 'less'),
                    'trend' => $thisMonthRevenue >= $lastMonthRevenue ? 'up' : 'down',
                    'meta' => 'This month total',
                ],
                'pendingPayments' => [
                    'value' => $pendingAmount,
                    'count' => $pendingCount,
                    'changeText' => $pendingCount . ' pending invoices',
                    'trend' => 'down',
                    'meta' => 'Awaiting payment',
                ],
                'patientsToday' => [
                    'value' => $todayConsultations,
                    'change' => $consultationChange,
                    'changeText' => ($consultationChange >= 0 ? '+' : '') . $consultationChange . ' vs yesterday',
                    'trend' => $consultationChange >= 0 ? 'up' : 'down',
                    'meta' => $totalPets . ' total registered pets',
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
