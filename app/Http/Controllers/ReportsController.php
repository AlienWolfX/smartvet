<?php

namespace App\Http\Controllers;

use App\Models\Consultation;
use App\Models\PetPayment;
use App\Models\Vaccination;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

class ReportsController extends Controller
{
    public function index()
    {
        // Get data for the last 6 months
        $startDate = now()->subMonths(6)->startOfMonth();
        $endDate = now()->endOfDay();

        // Revenue data by month (only paid payments)
        $revenueData = PetPayment::select(
                DB::raw("DATE_FORMAT(paid_at, '%b %Y') as period"),
                DB::raw('SUM(total_amount) as revenue'),
                DB::raw('MONTH(paid_at) as month_num'),
                DB::raw('YEAR(paid_at) as year_num')
            )
            ->where('status', 'paid')
            ->whereNotNull('paid_at')
            ->whereBetween('paid_at', [$startDate, $endDate])
            ->groupBy(DB::raw("DATE_FORMAT(paid_at, '%b %Y')"), DB::raw('MONTH(paid_at)'), DB::raw('YEAR(paid_at)'))
            ->orderBy('year_num')
            ->orderBy('month_num')
            ->get()
            ->map(function ($item) {
                return [
                    'period' => $item->period,
                    'revenue' => (float) $item->revenue,
                    'expenses' => (float) $item->revenue * 0.6, // Estimated expenses at 60%
                    'netProfit' => (float) $item->revenue * 0.4, // Estimated profit at 40%
                ];
            });

        // If no data, provide empty months
        if ($revenueData->isEmpty()) {
            $revenueData = collect();
            for ($i = 5; $i >= 0; $i--) {
                $date = now()->subMonths($i);
                $revenueData->push([
                    'period' => $date->format('M Y'),
                    'revenue' => 0,
                    'expenses' => 0,
                    'netProfit' => 0,
                ]);
            }
        }

        // Service data - consultations grouped by consultation_type
        $serviceData = Consultation::select(
                'consultation_type',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(consultation_fee) as revenue')
            )
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('consultation_type')
            ->groupBy('consultation_type')
            ->get()
            ->map(function ($item) {
                return [
                    'service' => $item->consultation_type ?: 'General Consultation',
                    'revenue' => (float) ($item->revenue ?? 0),
                    'count' => (int) $item->count,
                    'growth' => rand(-5, 25) / 10 * 10, // Placeholder growth
                ];
            });

        // Add vaccinations as a service
        $vaccinationCount = Vaccination::whereBetween('created_at', [$startDate, $endDate])->count();
        if ($vaccinationCount > 0) {
            $serviceData->push([
                'service' => 'Vaccinations',
                'revenue' => 0, // Vaccinations tracked separately
                'count' => $vaccinationCount,
                'growth' => 8.2,
            ]);
        }

        // Calculate totals (only paid payments)
        $totalRevenue = PetPayment::where('status', 'paid')
            ->whereNotNull('paid_at')
            ->whereBetween('paid_at', [$startDate, $endDate])
            ->sum('total_amount');
        $totalExpenses = $totalRevenue * 0.6; // Estimated
        $totalProfit = $totalRevenue - $totalExpenses;
        $profitMargin = $totalRevenue > 0 ? ($totalProfit / $totalRevenue) * 100 : 0;

        return Inertia::render('reports', [
            'revenueData' => $revenueData->values(),
            'serviceData' => $serviceData->values(),
            'totals' => [
                'totalRevenue' => (float) $totalRevenue,
                'totalExpenses' => (float) $totalExpenses,
                'totalProfit' => (float) $totalProfit,
                'profitMargin' => (float) $profitMargin,
            ],
        ]);
    }

    public function exportFinancial(Request $request)
    {
        $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        [$startDate, $endDate] = $this->getDateRange($request);

        // Get payments data
        $payments = PetPayment::with(['consultation.pet', 'items'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'desc')
            ->get();

        // Get consultations for revenue by service
        $consultations = Consultation::with(['pet'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        $spreadsheet = new Spreadsheet();

        // Summary Sheet
        $summarySheet = $spreadsheet->getActiveSheet();
        $summarySheet->setTitle('Financial Summary');

        $totalRevenue = $payments->sum('total_amount');
        $totalPaid = $payments->where('status', 'paid')->sum('total_amount');
        $totalPending = $payments->where('status', 'pending')->sum('total_amount');
        $avgTransaction = $payments->count() > 0 ? $totalRevenue / $payments->count() : 0;

        $summaryHeaders = ['Metric', 'Value'];
        foreach ($summaryHeaders as $index => $header) {
            $columnLetter = Coordinate::stringFromColumnIndex($index + 1);
            $summarySheet->setCellValue("{$columnLetter}1", $header);
        }

        $summaryData = [
            ['Report Period', $startDate->format('M d, Y') . ' - ' . $endDate->format('M d, Y')],
            ['Total Revenue', $this->formatPeso($totalRevenue)],
            ['Total Paid', $this->formatPeso($totalPaid)],
            ['Total Pending', $this->formatPeso($totalPending)],
            ['Total Transactions', $payments->count()],
            ['Average Transaction', $this->formatPeso($avgTransaction)],
        ];

        $row = 2;
        foreach ($summaryData as $data) {
            $summarySheet->setCellValue("A{$row}", $data[0]);
            $summarySheet->setCellValue("B{$row}", $data[1]);
            $row++;
        }

        foreach (range('A', 'B') as $column) {
            $summarySheet->getColumnDimension($column)->setAutoSize(true);
        }

        // Transactions Sheet
        $transSheet = $spreadsheet->createSheet();
        $transSheet->setTitle('Transactions');

        $transHeaders = ['Date', 'Transaction ID', 'Pet Name', 'Service', 'Amount', 'Status', 'Payment Method'];
        foreach ($transHeaders as $index => $header) {
            $columnLetter = Coordinate::stringFromColumnIndex($index + 1);
            $transSheet->setCellValue("{$columnLetter}1", $header);
        }

        $row = 2;
        foreach ($payments as $payment) {
            $transSheet->setCellValue("A{$row}", $payment->created_at->format('M d, Y'));
            $transSheet->setCellValue("B{$row}", 'TXN-' . str_pad($payment->id, 4, '0', STR_PAD_LEFT));
            $transSheet->setCellValue("C{$row}", $payment->consultation?->pet?->name ?? 'N/A');
            $transSheet->setCellValue("D{$row}", $payment->consultation?->consultation_type ?? 'Consultation');
            $transSheet->setCellValue("E{$row}", $this->formatPeso($payment->total_amount));
            $transSheet->setCellValue("F{$row}", ucfirst($payment->status));
            $transSheet->setCellValue("G{$row}", ucfirst($payment->payment_method ?? 'N/A'));
            $row++;
        }

        foreach (range('A', 'G') as $column) {
            $transSheet->getColumnDimension($column)->setAutoSize(true);
        }

        // Revenue by Service Sheet
        $serviceSheet = $spreadsheet->createSheet();
        $serviceSheet->setTitle('Revenue by Service');

        $serviceHeaders = ['Service Type', 'Count', 'Total Revenue'];
        foreach ($serviceHeaders as $index => $header) {
            $columnLetter = Coordinate::stringFromColumnIndex($index + 1);
            $serviceSheet->setCellValue("{$columnLetter}1", $header);
        }

        $serviceRevenue = $consultations->groupBy('consultation_type')->map(function ($group) {
            return [
                'count' => $group->count(),
                'revenue' => $group->sum('consultation_fee'),
            ];
        });

        $row = 2;
        foreach ($serviceRevenue as $service => $data) {
            $serviceSheet->setCellValue("A{$row}", $service ?: 'General Consultation');
            $serviceSheet->setCellValue("B{$row}", $data['count']);
            $serviceSheet->setCellValue("C{$row}", $this->formatPeso($data['revenue']));
            $row++;
        }

        foreach (range('A', 'C') as $column) {
            $serviceSheet->getColumnDimension($column)->setAutoSize(true);
        }

        $spreadsheet->setActiveSheetIndex(0);

        $fileName = 'financial-report-' . now()->format('Ymd_His') . '.xlsx';
        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function exportService(Request $request)
    {
        $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        [$startDate, $endDate] = $this->getDateRange($request);
        $serviceType = $request->input('service_type');

        // Get consultations
        $consultationsQuery = Consultation::with(['pet.owner', 'pet.species'])
            ->whereBetween('created_at', [$startDate, $endDate]);

        if ($serviceType && $serviceType !== 'all') {
            $consultationsQuery->where('consultation_type', 'like', "%{$serviceType}%");
        }

        $consultations = $consultationsQuery->orderBy('created_at', 'desc')->get();

        // Get vaccinations
        $vaccinations = Vaccination::with(['pet.owner', 'pet.species'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'desc')
            ->get();

        $spreadsheet = new Spreadsheet();

        // Summary Sheet
        $summarySheet = $spreadsheet->getActiveSheet();
        $summarySheet->setTitle('Service Summary');

        $summaryHeaders = ['Metric', 'Value'];
        foreach ($summaryHeaders as $index => $header) {
            $columnLetter = Coordinate::stringFromColumnIndex($index + 1);
            $summarySheet->setCellValue("{$columnLetter}1", $header);
        }

        $totalConsultations = $consultations->count();
        $totalVaccinations = $vaccinations->count();
        $totalServices = $totalConsultations + $totalVaccinations;
        $consultationRevenue = $consultations->sum('consultation_fee');

        $summaryData = [
            ['Report Period', $startDate->format('M d, Y') . ' - ' . $endDate->format('M d, Y')],
            ['Total Services Rendered', $totalServices],
            ['Total Consultations', $totalConsultations],
            ['Total Vaccinations', $totalVaccinations],
            ['Consultation Revenue', $this->formatPeso($consultationRevenue)],
            ['Unique Pets Served', $consultations->pluck('pet_id')->merge($vaccinations->pluck('pet_id'))->unique()->count()],
        ];

        $row = 2;
        foreach ($summaryData as $data) {
            $summarySheet->setCellValue("A{$row}", $data[0]);
            $summarySheet->setCellValue("B{$row}", $data[1]);
            $row++;
        }

        foreach (range('A', 'B') as $column) {
            $summarySheet->getColumnDimension($column)->setAutoSize(true);
        }

        // Consultations Sheet
        $consSheet = $spreadsheet->createSheet();
        $consSheet->setTitle('Consultations');

        $consHeaders = ['Date', 'Pet Name', 'Species', 'Owner', 'Purpose', 'Diagnosis', 'Fee', 'Status'];
        foreach ($consHeaders as $index => $header) {
            $columnLetter = Coordinate::stringFromColumnIndex($index + 1);
            $consSheet->setCellValue("{$columnLetter}1", $header);
        }

        $row = 2;
        foreach ($consultations as $consultation) {
            $consSheet->setCellValue("A{$row}", $consultation->created_at->format('M d, Y'));
            $consSheet->setCellValue("B{$row}", $consultation->pet?->name ?? 'N/A');
            $consSheet->setCellValue("C{$row}", $consultation->pet?->species?->name ?? 'Unknown');
            $consSheet->setCellValue("D{$row}", $consultation->pet?->owner?->name ?? 'N/A');
            $consSheet->setCellValue("E{$row}", $consultation->consultation_type ?? 'General');
            $consSheet->setCellValue("F{$row}", $consultation->diagnosis ?? 'N/A');
            $consSheet->setCellValue("G{$row}", $this->formatPeso($consultation->consultation_fee ?? 0));
            $consSheet->setCellValue("H{$row}", ucfirst($consultation->status ?? 'completed'));
            $row++;
        }

        foreach (range('A', 'H') as $column) {
            $consSheet->getColumnDimension($column)->setAutoSize(true);
        }

        // Vaccinations Sheet
        $vaccSheet = $spreadsheet->createSheet();
        $vaccSheet->setTitle('Vaccinations');

        $vaccHeaders = ['Date', 'Pet Name', 'Species', 'Owner', 'Vaccine Name', 'Batch Number', 'Next Due', 'Administered By'];
        foreach ($vaccHeaders as $index => $header) {
            $columnLetter = Coordinate::stringFromColumnIndex($index + 1);
            $vaccSheet->setCellValue("{$columnLetter}1", $header);
        }

        $row = 2;
        foreach ($vaccinations as $vaccination) {
            $vaccSheet->setCellValue("A{$row}", optional($vaccination->date_administered)->format('M d, Y') ?? '');
            $vaccSheet->setCellValue("B{$row}", $vaccination->pet?->name ?? 'N/A');
            $vaccSheet->setCellValue("C{$row}", $vaccination->pet?->species?->name ?? 'Unknown');
            $vaccSheet->setCellValue("D{$row}", $vaccination->pet?->owner?->name ?? 'N/A');
            $vaccSheet->setCellValue("E{$row}", $vaccination->vaccine_name ?? '');
            $vaccSheet->setCellValue("F{$row}", $vaccination->batch_number ?? 'N/A');
            $vaccSheet->setCellValue("G{$row}", optional($vaccination->next_due_date)->format('M d, Y') ?? 'N/A');
            $vaccSheet->setCellValue("H{$row}", $vaccination->administered_by ?? 'N/A');
            $row++;
        }

        foreach (range('A', 'H') as $column) {
            $vaccSheet->getColumnDimension($column)->setAutoSize(true);
        }

        // Service by Type Sheet
        $typeSheet = $spreadsheet->createSheet();
        $typeSheet->setTitle('Services by Type');

        $typeHeaders = ['Service Type', 'Count', 'Percentage'];
        foreach ($typeHeaders as $index => $header) {
            $columnLetter = Coordinate::stringFromColumnIndex($index + 1);
            $typeSheet->setCellValue("{$columnLetter}1", $header);
        }

        $servicesByType = $consultations->groupBy('consultation_type')->map(fn($group) => $group->count());
        $servicesByType['Vaccinations'] = $totalVaccinations;

        $row = 2;
        foreach ($servicesByType as $type => $count) {
            $percentage = $totalServices > 0 ? round(($count / $totalServices) * 100, 1) : 0;
            $typeSheet->setCellValue("A{$row}", $type ?: 'General Consultation');
            $typeSheet->setCellValue("B{$row}", $count);
            $typeSheet->setCellValue("C{$row}", $percentage . '%');
            $row++;
        }

        foreach (range('A', 'C') as $column) {
            $typeSheet->getColumnDimension($column)->setAutoSize(true);
        }

        $spreadsheet->setActiveSheetIndex(0);

        $fileName = 'service-report-' . now()->format('Ymd_His') . '.xlsx';
        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    private function getDateRange(Request $request): array
    {
        // Use date_from and date_to directly if provided
        if ($request->filled('date_from')) {
            $startDate = $request->date('date_from');
            $endDate = $request->filled('date_to') ? $request->date('date_to') : now();
        } else {
            // Default to last 6 months if no dates provided
            $endDate = now();
            $startDate = now()->subMonths(6);
        }

        return [$startDate->startOfDay(), $endDate->endOfDay()];
    }

    private function formatPeso(float $value): string
    {
        return '₱' . number_format($value, 2);
    }
}
