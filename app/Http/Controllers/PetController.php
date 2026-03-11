<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use App\Models\Owner;
use App\Models\PetSpecies;
use App\Models\InventoryItem;
use App\Http\Traits\ScopesToTenant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PetController extends Controller
{
    use ScopesToTenant;
    public function index()
    {
        $pets = $this->scopePetToUser(Pet::with(['owner', 'species']))
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($pet) {
                return [
                    'id' => 'PET-' . str_pad($pet->id, 3, '0', STR_PAD_LEFT),
                    'name' => $pet->name,
                    'species' => $pet->species->name,
                    'speciesIcon' => $pet->species->icon,
                    'breed' => $pet->breed ?? 'Mixed',
                    'age' => $pet->age ?? 0,
                    'weight' => $pet->weight ?? 0,
                    'gender' => $pet->gender,
                    'color' => $pet->color ?? 'Unknown',
                    'microchipId' => $pet->microchip_id ?? 'Not assigned',
                    'imageUrl' => $pet->image_path ? asset('storage/' . $pet->image_path) : null,
                    'qrUrl' => $pet->qr_token ? url('/scan/' . $pet->qr_token) : null,
                    'status' => $pet->status,
                    'lastVisit' => $pet->last_visit ? $pet->last_visit->toISOString() : $pet->created_at->toISOString(),
                    'registrationDate' => $pet->created_at->toISOString(),
                    'owner' => [
                        'name' => $pet->owner->name,
                        'phone' => $pet->owner->phone,
                        'email' => $pet->owner->email ?? '',
                        'address' => $pet->owner->full_address,
                        'street' => $pet->owner->street ?? '',
                        'barangay' => $pet->owner->barangay ?? '',
                        'city' => $pet->owner->city ?? '',
                        'province' => $pet->owner->province ?? '',
                        'zipCode' => $pet->owner->zip_code ?? '',
                        'emergencyContact' => $pet->owner->emergency_contact ?? '',
                    ],
                    // Mock data for existing UI compatibility
                    'medicalHistory' => [],
                    'vaccinations' => [
                        ['vaccine' => 'Rabies', 'lastDate' => null, 'nextDue' => now()->addYear()->toISOString(), 'status' => 'pending'],
                        ['vaccine' => 'DHPP', 'lastDate' => null, 'nextDue' => now()->addMonths(3)->toISOString(), 'status' => 'pending'],
                    ],
                    'allergies' => [],
                    'currentMedications' => [],
                ];
            });

        $species = PetSpecies::all()->map(function ($species) {
            return [
                'id' => strtolower($species->name),
                'name' => $species->name,
                'icon' => $species->icon,
            ];
        });

        return Inertia::render('pet-records', [
            'pets' => $pets,
            'species' => $species,
            'newPetQr' => session('newPetQr'),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'petName' => 'required|string|max:255',
            'species' => 'required|string',
            'breed' => 'nullable|string|max:255',
            'age' => 'nullable|integer|min:0|max:50',
            'weight' => 'nullable|numeric|min:0|max:500',
            'gender' => 'required|in:male,female',
            'color' => 'nullable|string|max:255',
            'microchipId' => 'nullable|string|max:255|unique:pets,microchip_id',
            'petImage' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'ownerName' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'province' => 'required|string',
            'city' => 'required|string',
            'barangay' => 'required|string',
            'street' => 'nullable|string|max:255',
            'zipCode' => 'nullable|string|max:10',
        ]);

        DB::transaction(function () use ($request) {
            // Handle image upload
            $imagePath = null;
            if ($request->hasFile('petImage')) {
                $imagePath = $request->file('petImage')->store('pets', 'public');
            }

            // Find or create the species
            $species = PetSpecies::where('name', $request->species)->first();
            if (!$species) {
                $species = PetSpecies::create([
                    'name' => $request->species,
                    'icon' => '🐾', // Default icon
                ]);
            }

            // Create or find owner
            $accountUser = $request->email
                ? \App\Models\User::where('email', $request->email)
                    ->where('role', \App\Models\User::ROLE_OWNER)
                    ->first()
                : null;

            $owner = Owner::create([
                'user_id'         => $this->tenantUserId(),
                'account_user_id' => $accountUser?->id,
                'name'            => $request->ownerName,
                'phone'           => $request->phone,
                'email'           => $request->email,
                'street'          => $request->street,
                'barangay'        => $request->barangay,
                'city'            => $request->city,
                'province'        => $request->province,
                'zip_code'        => $request->zipCode,
                'address'         => implode(', ', array_filter([
                    $request->street,
                    $request->barangay,
                    $request->city,
                    $request->province,
                    $request->zipCode,
                ])),
                'emergency_contact' => null,
            ]);

            // Create pet
            $pet = Pet::create([
                'name' => $request->petName,
                'owner_id' => $owner->id,
                'species_id' => $species->id,
                'breed' => $request->breed,
                'age' => $request->age,
                'weight' => $request->weight,
                'gender' => $request->gender,
                'color' => $request->color,
                'microchip_id' => $request->microchipId,
                'qr_token' => Str::uuid(),
                'image_path' => $imagePath,
                'status' => 'active',
                'last_visit' => now(),
            ]);

            session([
                'newPetQr' => [
                    'petId'   => 'PET-' . str_pad($pet->id, 3, '0', STR_PAD_LEFT),
                    'name'    => $pet->name,
                    'species' => $species->name,
                    'breed'   => $pet->breed ?? 'Mixed',
                    'qrUrl'   => url('/scan/' . $pet->qr_token),
                ],
            ]);
        });

        return redirect()->back()->with('success', 'Pet registered successfully!');
    }

    public function scannerPage()
    {
        return Inertia::render('clinic/pet-scanner');
    }

    public function manage($petId)
    {
        // Extract numeric ID from PET-XXX format
        $numericId = (int) str_replace('PET-', '', $petId);

        $pet = $this->scopePetToUser(Pet::with([
                'owner',
                'species',
                'consultations.files',
                'consultations.vaccinations',
                'consultations.medications',
                'vaccinations.consultation',
                'medications.consultation',
            ]))
            ->where('id', $numericId)
            ->firstOrFail();

        // Format consultation data
        $consultations = $pet->consultations->map(function ($consultation) {
            return [
                'id' => $consultation->id,
                'type' => $consultation->consultation_type,
                'date' => $consultation->consultation_date->toISOString(),
                'complaint' => $consultation->chief_complaint,
                'diagnosis' => $consultation->diagnosis,
                'treatment' => $consultation->treatment,
                'notes' => $consultation->notes,
                'veterinarian' => $consultation->veterinarian,
                'paymentStatus' => $consultation->payment_status,
                'fee' => $consultation->consultation_fee,
                    'linkedVaccinations' => $consultation->vaccinations->map(function ($vaccination) {
                        return [
                            'id' => $vaccination->id,
                            'vaccine' => $vaccination->vaccine_name,
                            'date' => $vaccination->vaccination_date->toISOString(),
                        ];
                    }),
                    'linkedMedications' => $consultation->medications->map(function ($medication) {
                        return [
                            'id' => $medication->id,
                            'name' => $medication->medication_name,
                        ];
                    }),
                'files' => $consultation->files->map(function ($file) {
                    return [
                        'id' => $file->id,
                        'name' => $file->original_name,
                        'url' => asset('storage/' . $file->file_path),
                        'type' => $file->file_type,
                        'size' => $file->file_size_formatted,
                        'isImage' => $file->isImage(),
                    ];
                }),
            ];
        });

        // Format vaccination data
        $vaccinations = $pet->vaccinations->map(function ($vaccination) {
            return [
                'id' => $vaccination->id,
                'vaccine' => $vaccination->vaccine_name,
                'lastDate' => $vaccination->vaccination_date->toISOString(),
                'nextDue' => $vaccination->next_due_date->toISOString(),
                'status' => $this->getVaccinationStatus($vaccination->next_due_date),
                'paymentStatus' => $vaccination->payment_status,
                'administeredBy' => $vaccination->administered_by,
                'notes' => $vaccination->notes,
                    'consultation' => $vaccination->consultation ? [
                        'id' => $vaccination->consultation->id,
                        'type' => $vaccination->consultation->consultation_type,
                        'date' => $vaccination->consultation->consultation_date->toISOString(),
                    ] : null,
            ];
        });

        // Format medication data
        $medications = $pet->medications->where('status', 'active')->map(function ($medication) {
            return [
                'id' => $medication->id,
                'name' => $medication->medication_name,
                'dosage' => $medication->dosage,
                'frequency' => $medication->frequency,
                'purpose' => $medication->purpose,
                'duration' => $medication->duration_days ? "{$medication->duration_days} days" : 'Ongoing',
                'startDate' => $medication->start_date->toISOString(),
                'endDate' => $medication->end_date ? $medication->end_date->toISOString() : null,
                    'consultation' => $medication->consultation ? [
                        'id' => $medication->consultation->id,
                        'type' => $medication->consultation->consultation_type,
                        'date' => $medication->consultation->consultation_date->toISOString(),
                    ] : null,
            ];
        });

        $consultationOptions = $pet->consultations->map(function ($consultation) {
            return [
                'id' => $consultation->id,
                'label' => sprintf(
                    '%s • %s',
                    Str::headline(str_replace('-', ' ', $consultation->consultation_type)),
                    $consultation->consultation_date->format('M d, Y')
                ),
                'type' => $consultation->consultation_type,
                'date' => $consultation->consultation_date->toISOString(),
            ];
        });

        // Format pet data for frontend
        $petData = [
            'id' => 'PET-' . str_pad($pet->id, 3, '0', STR_PAD_LEFT),
            'name' => $pet->name,
            'species' => $pet->species->name,
            'speciesIcon' => $pet->species->icon,
            'breed' => $pet->breed ?? 'Mixed',
            'age' => $pet->age ?? 0,
            'weight' => $pet->weight ?? 0,
            'gender' => $pet->gender,
            'color' => $pet->color ?? 'Unknown',
            'microchipId' => $pet->microchip_id ?? 'Not assigned',
            'imageUrl' => $pet->image_path ? asset('storage/' . $pet->image_path) : null,
            'status' => $pet->status,
            'lastVisit' => $pet->last_visit ? $pet->last_visit->toISOString() : $pet->created_at->toISOString(),
            'registrationDate' => $pet->created_at->toISOString(),
            'owner' => [
                'name' => $pet->owner->name,
                'phone' => $pet->owner->phone,
                'email' => $pet->owner->email ?? '',
                'address' => $pet->owner->full_address,
                'street' => $pet->owner->street ?? '',
                'barangay' => $pet->owner->barangay ?? '',
                'city' => $pet->owner->city ?? '',
                'province' => $pet->owner->province ?? '',
                'zipCode' => $pet->owner->zip_code ?? '',
                'emergencyContact' => $pet->owner->emergency_contact ?? '',
            ],
            'medicalHistory' => $consultations,
            'vaccinations' => $vaccinations,
            'allergies' => [],
            'currentMedications' => $medications,
            'consultationOptions' => $consultationOptions,
        ];

        $inventoryItems = $this->scopeToUser(InventoryItem::with('category'))
            ->orderBy('name')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'code' => $item->item_code,
                'name' => $item->name,
                'brand' => $item->brand,
                'category' => $item->category?->name ?? 'Uncategorized',
                'categorySlug' => $item->category?->slug ?? 'uncategorized',
                'currentStock' => $item->current_stock,
                'unitPrice' => (float) $item->unit_price,
            ]);

        $vaccinationItems = $inventoryItems->filter(fn ($item) => $item['categorySlug'] === 'vaccination')->values();

        return Inertia::render('pet-manage', [
            'pet' => $petData,
            'inventoryItems' => $inventoryItems,
            'vaccinationItems' => $vaccinationItems,
        ]);
    }

    private function getVaccinationStatus($nextDueDate)
    {
        $today = now();
        $dueDate = $nextDueDate;

        if ($dueDate < $today) {
            return 'overdue';
        } elseif ($dueDate <= $today->addDays(30)) {
            return 'due-soon';
        } else {
            return 'current';
        }
    }

    public function export(Request $request)
    {
        $request->validate([
            'type' => ['nullable', 'in:all,individual'],
            'pet_id' => ['nullable', 'string'],
            'species' => ['nullable', 'string'],
            'status' => ['nullable', 'in:all,active,inactive'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'include_consultations' => ['nullable'],
            'include_vaccinations' => ['nullable'],
            'include_owner_info' => ['nullable'],
        ]);

        $exportType = $request->input('type', 'all');
        $petIdRaw = $request->input('pet_id');
        // Extract numeric ID from PET-001 format or plain number
        $petId = $petIdRaw ? (int) preg_replace('/[^0-9]/', '', $petIdRaw) : null;

        // Check if parameters exist in the request
        $includeConsultations = $request->has('include_consultations') || $request->input('include_consultations') === '1';
        $includeVaccinations = $request->has('include_vaccinations') || $request->input('include_vaccinations') === '1';
        $includeOwnerInfo = $request->has('include_owner_info') || $request->input('include_owner_info') === '1';

        $petsQuery = $this->scopePetToUser(Pet::with(['owner', 'species']));

        if ($exportType === 'individual') {
            // Load relationships for detailed export
            $petsQuery->with(['consultations', 'vaccinations']);

            // Filter by specific pet ID for individual export
            if ($petId) {
                $petsQuery->where('id', $petId);
            }
        } else {
            // Apply filters only for "all" export type
            $species = $request->string('species')->toString();
            if ($species && $species !== 'all') {
                $petsQuery->whereHas('species', function ($query) use ($species) {
                    $query->whereRaw('LOWER(name) = ?', [strtolower($species)]);
                });
            }

            $status = $request->string('status')->toString();
            if ($status && $status !== 'all') {
                $petsQuery->where('status', $status);
            }

            if ($request->filled('date_from')) {
                $petsQuery->whereDate('created_at', '>=', $request->date('date_from'));
            }

            if ($request->filled('date_to')) {
                $petsQuery->whereDate('created_at', '<=', $request->date('date_to'));
            }
        }

        $petsQuery->orderBy('name');
        $pets = $petsQuery->get();

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();

        if ($exportType === 'individual') {
            $this->createDetailedExport($spreadsheet, $pets, $includeConsultations, $includeVaccinations, $includeOwnerInfo);
        } else {
            $this->createSummaryExport($spreadsheet, $pets);
        }

        $fileName = 'pet-records-export-' . now()->format('Ymd_His') . '.xlsx';
        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    private function createSummaryExport($spreadsheet, $pets)
    {
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Pet Records');

        $headers = [
            'Pet ID',
            'Pet Name',
            'Species',
            'Breed',
            'Age',
            'Weight (kg)',
            'Gender',
            'Color',
            'Microchip ID',
            'Status',
            'Owner Name',
            'Owner Phone',
            'Owner Email',
            'Owner Address',
            'Last Visit',
            'Registration Date',
        ];

        foreach ($headers as $index => $header) {
            $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($index + 1);
            $sheet->setCellValue("{$columnLetter}1", $header);
        }

        $row = 2;
        foreach ($pets as $pet) {
            $sheet->setCellValue("A{$row}", 'PET-' . str_pad($pet->id, 3, '0', STR_PAD_LEFT));
            $sheet->setCellValue("B{$row}", $pet->name);
            $sheet->setCellValue("C{$row}", $pet->species?->name ?? 'Unknown');
            $sheet->setCellValue("D{$row}", $pet->breed ?? 'Mixed');
            $sheet->setCellValue("E{$row}", $pet->age ?? 0);
            $sheet->setCellValue("F{$row}", $pet->weight ?? 0);
            $sheet->setCellValue("G{$row}", ucfirst($pet->gender));
            $sheet->setCellValue("H{$row}", $pet->color ?? 'Unknown');
            $sheet->setCellValue("I{$row}", $pet->microchip_id ?? 'Not assigned');
            $sheet->setCellValue("J{$row}", ucfirst($pet->status));
            $sheet->setCellValue("K{$row}", $pet->owner?->name ?? '');
            $sheet->setCellValue("L{$row}", $pet->owner?->phone ?? '');
            $sheet->setCellValue("M{$row}", $pet->owner?->email ?? '');
            $sheet->setCellValue("N{$row}", $pet->owner?->address ?? '');
            $sheet->setCellValue("O{$row}", optional($pet->last_visit)->toDateString() ?? '');
            $sheet->setCellValue("P{$row}", $pet->created_at->toDateString());
            $row++;
        }

        foreach (range('A', 'P') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }
    }

    private function createDetailedExport($spreadsheet, $pets, $includeConsultations, $includeVaccinations, $includeOwnerInfo)
    {
        // Pets sheet
        $petsSheet = $spreadsheet->getActiveSheet();
        $petsSheet->setTitle('Pets');

        $headers = ['Pet ID', 'Pet Name', 'Species', 'Breed', 'Age', 'Weight (kg)', 'Gender', 'Color', 'Microchip ID', 'Status', 'Registration Date'];

        if ($includeOwnerInfo) {
            $headers = array_merge($headers, ['Owner Name', 'Owner Phone', 'Owner Email', 'Owner Address']);
        }

        foreach ($headers as $index => $header) {
            $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($index + 1);
            $petsSheet->setCellValue("{$columnLetter}1", $header);
        }

        $row = 2;
        foreach ($pets as $pet) {
            $col = 1;
            $petsSheet->setCellValue(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col++) . $row, 'PET-' . str_pad($pet->id, 3, '0', STR_PAD_LEFT));
            $petsSheet->setCellValue(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col++) . $row, $pet->name);
            $petsSheet->setCellValue(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col++) . $row, $pet->species?->name ?? 'Unknown');
            $petsSheet->setCellValue(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col++) . $row, $pet->breed ?? 'Mixed');
            $petsSheet->setCellValue(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col++) . $row, $pet->age ?? 0);
            $petsSheet->setCellValue(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col++) . $row, $pet->weight ?? 0);
            $petsSheet->setCellValue(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col++) . $row, ucfirst($pet->gender));
            $petsSheet->setCellValue(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col++) . $row, $pet->color ?? 'Unknown');
            $petsSheet->setCellValue(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col++) . $row, $pet->microchip_id ?? 'Not assigned');
            $petsSheet->setCellValue(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col++) . $row, ucfirst($pet->status));
            $petsSheet->setCellValue(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col++) . $row, $pet->created_at->toDateString());

            if ($includeOwnerInfo) {
                $petsSheet->setCellValue(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col++) . $row, $pet->owner?->name ?? '');
                $petsSheet->setCellValue(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col++) . $row, $pet->owner?->phone ?? '');
                $petsSheet->setCellValue(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col++) . $row, $pet->owner?->email ?? '');
                $petsSheet->setCellValue(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col++) . $row, $pet->owner?->address ?? '');
            }
            $row++;
        }

        $lastCol = $includeOwnerInfo ? 'O' : 'K';
        foreach (range('A', $lastCol) as $column) {
            $petsSheet->getColumnDimension($column)->setAutoSize(true);
        }

        // Consultations sheet
        if ($includeConsultations) {
            $consultSheet = $spreadsheet->createSheet();
            $consultSheet->setTitle('Consultations');

            $consultHeaders = ['Pet ID', 'Pet Name', 'Consultation Date', 'Type', 'Chief Complaint', 'Diagnosis', 'Treatment', 'Fee', 'Veterinarian', 'Status', 'Notes'];
            foreach ($consultHeaders as $index => $header) {
                $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($index + 1);
                $consultSheet->setCellValue("{$columnLetter}1", $header);
            }

            $row = 2;
            foreach ($pets as $pet) {
                foreach ($pet->consultations as $consultation) {
                    $consultSheet->setCellValue("A{$row}", 'PET-' . str_pad($pet->id, 3, '0', STR_PAD_LEFT));
                    $consultSheet->setCellValue("B{$row}", $pet->name);
                    $consultSheet->setCellValue("C{$row}", optional($consultation->consultation_date)->toDateString() ?? '');
                    $consultSheet->setCellValue("D{$row}", $consultation->consultation_type ?? '');
                    $consultSheet->setCellValue("E{$row}", $consultation->chief_complaint ?? '');
                    $consultSheet->setCellValue("F{$row}", $consultation->diagnosis ?? '');
                    $consultSheet->setCellValue("G{$row}", $consultation->treatment ?? '');
                    $consultSheet->setCellValue("H{$row}", $consultation->consultation_fee ?? 0);
                    $consultSheet->setCellValue("I{$row}", $consultation->veterinarian ?? '');
                    $consultSheet->setCellValue("J{$row}", $consultation->status ?? '');
                    $consultSheet->setCellValue("K{$row}", $consultation->notes ?? '');
                    $row++;
                }
            }

            foreach (range('A', 'K') as $column) {
                $consultSheet->getColumnDimension($column)->setAutoSize(true);
            }
        }

        // Vaccinations sheet
        if ($includeVaccinations) {
            $vaccSheet = $spreadsheet->createSheet();
            $vaccSheet->setTitle('Vaccinations');

            $vaccHeaders = ['Pet ID', 'Pet Name', 'Vaccine Name', 'Vaccination Date', 'Next Due Date', 'Administered By', 'Cost', 'Notes'];
            foreach ($vaccHeaders as $index => $header) {
                $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($index + 1);
                $vaccSheet->setCellValue("{$columnLetter}1", $header);
            }

            $row = 2;
            foreach ($pets as $pet) {
                foreach ($pet->vaccinations as $vaccination) {
                    $vaccSheet->setCellValue("A{$row}", 'PET-' . str_pad($pet->id, 3, '0', STR_PAD_LEFT));
                    $vaccSheet->setCellValue("B{$row}", $pet->name);
                    $vaccSheet->setCellValue("C{$row}", $vaccination->vaccine_name ?? '');
                    $vaccSheet->setCellValue("D{$row}", optional($vaccination->vaccination_date)->toDateString() ?? '');
                    $vaccSheet->setCellValue("E{$row}", optional($vaccination->next_due_date)->toDateString() ?? '');
                    $vaccSheet->setCellValue("F{$row}", $vaccination->administered_by ?? '');
                    $vaccSheet->setCellValue("G{$row}", $vaccination->cost ?? 0);
                    $vaccSheet->setCellValue("H{$row}", $vaccination->notes ?? '');
                    $row++;
                }
            }

            foreach (range('A', 'H') as $column) {
                $vaccSheet->getColumnDimension($column)->setAutoSize(true);
            }
        }

        // Set the first sheet as active
        $spreadsheet->setActiveSheetIndex(0);
    }

    public function destroy($petId)
    {
        // Extract numeric ID from PET-XXX format
        $numericId = (int) str_replace('PET-', '', $petId);

        $pet = $this->scopePetToUser(Pet::where('id', $numericId))->firstOrFail();

        // Delete pet image if it exists
        if ($pet->image_path) {
            $imagePath = storage_path('app/public/' . $pet->image_path);
            if (file_exists($imagePath)) {
                unlink($imagePath);
            }
        }

        // Delete consultation files
        foreach ($pet->consultations as $consultation) {
            foreach ($consultation->files as $file) {
                $filePath = storage_path('app/public/' . $file->file_path);
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
            }
        }

        $petName = $pet->name;
        $pet->delete(); // Cascade handles related records

        return redirect()->route('pet-records')->with('success', "{$petName}'s record has been deleted.");
    }
}
