<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vaccination;
use App\Models\Pet;
use App\Models\Consultation;
use Carbon\Carbon;

class VaccinationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $pets = Pet::with('consultations')->get();

        $vaccinations = [
            // Bantay (Dog) vaccinations
            [
                'pet_name' => 'Bantay',
                'vaccine_name' => 'Canine 5-in-1 (DHPP)',
                'vaccine_type' => 'Core',
                'vaccination_date' => Carbon::now()->subMonths(6),
                'next_due_date' => Carbon::now()->addMonths(6),
                'batch_number' => 'NV2024-156',
                'manufacturer' => 'Nobivac',
                'administered_by' => 'Dr. Santos',
                'clinic_location' => 'SmartVet Clinic - Main',
                'notes' => 'Annual booster administered. No adverse reactions.',
                'payment_status' => 'paid',
            ],
            [
                'pet_name' => 'Bantay',
                'vaccine_name' => 'Anti-Rabies',
                'vaccine_type' => 'Core',
                'vaccination_date' => Carbon::now()->subMonths(6),
                'next_due_date' => Carbon::now()->addMonths(6),
                'batch_number' => 'RB2024-089',
                'manufacturer' => 'Rabisin',
                'administered_by' => 'Dr. Santos',
                'clinic_location' => 'SmartVet Clinic - Main',
                'notes' => 'Rabies certificate issued.',
                'payment_status' => 'paid',
            ],
            [
                'pet_name' => 'Bantay',
                'vaccine_name' => 'Kennel Cough (Bordetella)',
                'vaccine_type' => 'Non-Core',
                'vaccination_date' => Carbon::now()->subMonths(8),
                'next_due_date' => Carbon::now()->addMonths(4),
                'batch_number' => 'KC2024-045',
                'manufacturer' => 'Nobivac',
                'administered_by' => 'Dr. Reyes',
                'clinic_location' => 'SmartVet Clinic - Main',
                'notes' => 'Intranasal vaccine. Pet attending daycare regularly.',
                'payment_status' => 'paid',
            ],
            // Mingming (Cat) vaccinations
            [
                'pet_name' => 'Mingming',
                'vaccine_name' => 'Feline 4-in-1 (FVRCP)',
                'vaccine_type' => 'Core',
                'vaccination_date' => Carbon::now()->subDays(45),
                'next_due_date' => Carbon::now()->addMonths(11),
                'batch_number' => 'FC2025-023',
                'manufacturer' => 'Felocell',
                'administered_by' => 'Dr. Santos',
                'clinic_location' => 'SmartVet Clinic - Main',
                'notes' => 'Indoor cat. Annual vaccination schedule.',
                'payment_status' => 'paid',
            ],
            [
                'pet_name' => 'Mingming',
                'vaccine_name' => 'Anti-Rabies',
                'vaccine_type' => 'Core',
                'vaccination_date' => Carbon::now()->subMonths(3),
                'next_due_date' => Carbon::now()->addMonths(9),
                'batch_number' => 'RB2024-112',
                'manufacturer' => 'Rabisin',
                'administered_by' => 'Dr. Santos',
                'clinic_location' => 'SmartVet Clinic - Main',
                'notes' => null,
                'payment_status' => 'paid',
            ],
            // Bruno (Golden Retriever) vaccinations
            [
                'pet_name' => 'Bruno',
                'vaccine_name' => 'Canine 5-in-1 (DHPP)',
                'vaccine_type' => 'Core',
                'vaccination_date' => Carbon::now()->subMonths(4),
                'next_due_date' => Carbon::now()->addMonths(8),
                'batch_number' => 'NV2024-178',
                'manufacturer' => 'Nobivac',
                'administered_by' => 'Dr. Reyes',
                'clinic_location' => 'SmartVet Clinic - Main',
                'notes' => 'Senior dog protocol. All boosters up to date.',
                'payment_status' => 'paid',
            ],
            [
                'pet_name' => 'Bruno',
                'vaccine_name' => 'Anti-Rabies',
                'vaccine_type' => 'Core',
                'vaccination_date' => Carbon::now()->subMonths(4),
                'next_due_date' => Carbon::now()->addMonths(8),
                'batch_number' => 'RB2024-134',
                'manufacturer' => 'Rabisin',
                'administered_by' => 'Dr. Reyes',
                'clinic_location' => 'SmartVet Clinic - Main',
                'notes' => null,
                'payment_status' => 'paid',
            ],
            [
                'pet_name' => 'Bruno',
                'vaccine_name' => 'Leptospirosis',
                'vaccine_type' => 'Non-Core',
                'vaccination_date' => Carbon::now()->subMonths(4),
                'next_due_date' => Carbon::now()->addMonths(8),
                'batch_number' => 'LP2024-056',
                'manufacturer' => 'Nobivac',
                'administered_by' => 'Dr. Reyes',
                'clinic_location' => 'SmartVet Clinic - Main',
                'notes' => 'Outdoor dog with water exposure. Annual booster recommended.',
                'payment_status' => 'paid',
            ],
            // Max (German Shepherd) vaccinations
            [
                'pet_name' => 'Max',
                'vaccine_name' => 'Canine 5-in-1 (DHPP)',
                'vaccine_type' => 'Core',
                'vaccination_date' => Carbon::now()->subMonths(2),
                'next_due_date' => Carbon::now()->addMonths(10),
                'batch_number' => 'NV2025-012',
                'manufacturer' => 'Nobivac',
                'administered_by' => 'Dr. Santos',
                'clinic_location' => 'SmartVet Clinic - Main',
                'notes' => null,
                'payment_status' => 'paid',
            ],
            [
                'pet_name' => 'Max',
                'vaccine_name' => 'Anti-Rabies',
                'vaccine_type' => 'Core',
                'vaccination_date' => Carbon::now()->subMonths(2),
                'next_due_date' => Carbon::now()->addMonths(10),
                'batch_number' => 'RB2025-008',
                'manufacturer' => 'Rabisin',
                'administered_by' => 'Dr. Santos',
                'clinic_location' => 'SmartVet Clinic - Main',
                'notes' => 'Working dog. Certificate required for training facility.',
                'payment_status' => 'paid',
            ],
            // Whiskers (Persian Cat) vaccinations
            [
                'pet_name' => 'Whiskers',
                'vaccine_name' => 'Feline 4-in-1 (FVRCP)',
                'vaccine_type' => 'Core',
                'vaccination_date' => Carbon::now()->subMonths(5),
                'next_due_date' => Carbon::now()->addMonths(7),
                'batch_number' => 'FC2024-089',
                'manufacturer' => 'Felocell',
                'administered_by' => 'Dr. Reyes',
                'clinic_location' => 'SmartVet Clinic - Main',
                'notes' => 'Strictly indoor cat.',
                'payment_status' => 'paid',
            ],
            // Rocky (Bulldog) vaccinations
            [
                'pet_name' => 'Rocky',
                'vaccine_name' => 'Canine 5-in-1 (DHPP)',
                'vaccine_type' => 'Core',
                'vaccination_date' => Carbon::now()->subMonths(3),
                'next_due_date' => Carbon::now()->addMonths(9),
                'batch_number' => 'NV2024-201',
                'manufacturer' => 'Nobivac',
                'administered_by' => 'Dr. Santos',
                'clinic_location' => 'SmartVet Clinic - Main',
                'notes' => 'Monitored for 30 minutes post-vaccination due to brachycephalic breed.',
                'payment_status' => 'paid',
            ],
            [
                'pet_name' => 'Rocky',
                'vaccine_name' => 'Anti-Rabies',
                'vaccine_type' => 'Core',
                'vaccination_date' => Carbon::now()->subMonths(3),
                'next_due_date' => Carbon::now()->addMonths(9),
                'batch_number' => 'RB2024-156',
                'manufacturer' => 'Rabisin',
                'administered_by' => 'Dr. Santos',
                'clinic_location' => 'SmartVet Clinic - Main',
                'notes' => null,
                'payment_status' => 'paid',
            ],
            // Luna (Siamese Cat) vaccinations
            [
                'pet_name' => 'Luna',
                'vaccine_name' => 'Feline 4-in-1 (FVRCP)',
                'vaccine_type' => 'Core',
                'vaccination_date' => Carbon::now()->subMonths(1),
                'next_due_date' => Carbon::now()->addMonths(11),
                'batch_number' => 'FC2025-034',
                'manufacturer' => 'Felocell',
                'administered_by' => 'Dr. Santos',
                'clinic_location' => 'SmartVet Clinic - Main',
                'notes' => null,
                'payment_status' => 'paid',
            ],
            // Buddy (Beagle) vaccinations
            [
                'pet_name' => 'Buddy',
                'vaccine_name' => 'Canine 5-in-1 (DHPP)',
                'vaccine_type' => 'Core',
                'vaccination_date' => Carbon::now()->subDays(10),
                'next_due_date' => Carbon::now()->addMonths(12),
                'batch_number' => 'NV2025-045',
                'manufacturer' => 'Nobivac',
                'administered_by' => 'Dr. Reyes',
                'clinic_location' => 'SmartVet Clinic - Main',
                'notes' => 'Annual booster. Pet in excellent health.',
                'payment_status' => 'paid',
            ],
            [
                'pet_name' => 'Buddy',
                'vaccine_name' => 'Anti-Rabies',
                'vaccine_type' => 'Core',
                'vaccination_date' => Carbon::now()->subDays(10),
                'next_due_date' => Carbon::now()->addMonths(12),
                'batch_number' => 'RB2025-023',
                'manufacturer' => 'Rabisin',
                'administered_by' => 'Dr. Reyes',
                'clinic_location' => 'SmartVet Clinic - Main',
                'notes' => null,
                'payment_status' => 'paid',
            ],
            // Cleo (Maine Coon) vaccinations
            [
                'pet_name' => 'Cleo',
                'vaccine_name' => 'Feline 4-in-1 (FVRCP)',
                'vaccine_type' => 'Core',
                'vaccination_date' => Carbon::now()->subMonths(2),
                'next_due_date' => Carbon::now()->addMonths(10),
                'batch_number' => 'FC2025-012',
                'manufacturer' => 'Felocell',
                'administered_by' => 'Dr. Santos',
                'clinic_location' => 'SmartVet Clinic - Main',
                'notes' => 'Large breed cat. Administered prior to spay surgery.',
                'payment_status' => 'paid',
            ],
            [
                'pet_name' => 'Cleo',
                'vaccine_name' => 'Anti-Rabies',
                'vaccine_type' => 'Core',
                'vaccination_date' => Carbon::now()->subMonths(2),
                'next_due_date' => Carbon::now()->addMonths(10),
                'batch_number' => 'RB2025-015',
                'manufacturer' => 'Rabisin',
                'administered_by' => 'Dr. Santos',
                'clinic_location' => 'SmartVet Clinic - Main',
                'notes' => null,
                'payment_status' => 'paid',
            ],
        ];

        foreach ($vaccinations as $vaccinationData) {
            $pet = $pets->where('name', $vaccinationData['pet_name'])->first();

            if ($pet) {
                // Find related consultation if exists
                $consultation = $pet->consultations()
                    ->whereDate('consultation_date', $vaccinationData['vaccination_date'])
                    ->first();

                Vaccination::firstOrCreate(
                    [
                        'pet_id' => $pet->id,
                        'vaccine_name' => $vaccinationData['vaccine_name'],
                        'vaccination_date' => $vaccinationData['vaccination_date'],
                    ],
                    [
                        'pet_id' => $pet->id,
                        'consultation_id' => $consultation?->id,
                        'vaccine_name' => $vaccinationData['vaccine_name'],
                        'vaccine_type' => $vaccinationData['vaccine_type'],
                        'vaccination_date' => $vaccinationData['vaccination_date'],
                        'next_due_date' => $vaccinationData['next_due_date'],
                        'batch_number' => $vaccinationData['batch_number'],
                        'manufacturer' => $vaccinationData['manufacturer'],
                        'administered_by' => $vaccinationData['administered_by'],
                        'clinic_location' => $vaccinationData['clinic_location'],
                        'notes' => $vaccinationData['notes'],
                        'payment_status' => $vaccinationData['payment_status'],
                    ]
                );
            }
        }
    }
}
