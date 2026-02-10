<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Medication;
use App\Models\Pet;
use App\Models\Consultation;
use Carbon\Carbon;

class MedicationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $pets = Pet::with('consultations')->get();

        $medications = [
            // Bantay (Dog) - Skin irritation medications
            [
                'pet_name' => 'Bantay',
                'consultation_complaint' => 'Skin irritation',
                'medication_name' => 'Cetirizine',
                'generic_name' => 'Cetirizine Hydrochloride',
                'dosage' => '10mg',
                'frequency' => 'Once daily',
                'route' => 'Oral',
                'purpose' => 'Antihistamine for allergic dermatitis',
                'start_date' => Carbon::now()->subDays(7),
                'end_date' => Carbon::now()->addDays(7),
                'duration_days' => 14,
                'cost' => 350.00,
                'prescribed_by' => 'Dr. Santos',
                'instructions' => 'Give with food in the morning',
                'side_effects' => 'May cause drowsiness',
                'notes' => null,
                'status' => 'active',
            ],
            [
                'pet_name' => 'Bantay',
                'consultation_complaint' => 'Skin irritation',
                'medication_name' => 'Medicated Shampoo',
                'generic_name' => 'Chlorhexidine Shampoo',
                'dosage' => 'As directed',
                'frequency' => 'Twice weekly',
                'route' => 'Topical',
                'purpose' => 'Antibacterial/antifungal skin treatment',
                'start_date' => Carbon::now()->subDays(7),
                'end_date' => Carbon::now()->addDays(21),
                'duration_days' => 28,
                'cost' => 450.00,
                'prescribed_by' => 'Dr. Santos',
                'instructions' => 'Leave on skin for 10 minutes before rinsing. Avoid eyes.',
                'side_effects' => 'May cause skin dryness',
                'notes' => 'Use lukewarm water',
                'status' => 'active',
            ],
            // Bruno (Golden Retriever) - Hip dysplasia medications
            [
                'pet_name' => 'Bruno',
                'consultation_complaint' => 'Limping',
                'medication_name' => 'Meloxicam',
                'generic_name' => 'Meloxicam',
                'dosage' => '0.1mg/kg',
                'frequency' => 'Once daily',
                'route' => 'Oral',
                'purpose' => 'NSAID for pain and inflammation',
                'start_date' => Carbon::now()->subDays(14),
                'end_date' => Carbon::now()->addDays(14),
                'duration_days' => 28,
                'cost' => 850.00,
                'prescribed_by' => 'Dr. Reyes',
                'instructions' => 'Give with food to prevent stomach upset',
                'side_effects' => 'May cause GI upset, monitor for vomiting',
                'notes' => 'Do not give with other NSAIDs or steroids',
                'status' => 'active',
            ],
            [
                'pet_name' => 'Bruno',
                'consultation_complaint' => 'Limping',
                'medication_name' => 'Glucosamine Chondroitin',
                'generic_name' => 'Glucosamine/Chondroitin Sulfate',
                'dosage' => '1500mg/1200mg',
                'frequency' => 'Once daily',
                'route' => 'Oral',
                'purpose' => 'Joint supplement for cartilage support',
                'start_date' => Carbon::now()->subDays(14),
                'end_date' => null,
                'duration_days' => null,
                'cost' => 1200.00,
                'prescribed_by' => 'Dr. Reyes',
                'instructions' => 'Long-term supplement. Can be mixed with food.',
                'side_effects' => 'Generally well tolerated',
                'notes' => 'Continue indefinitely for joint health',
                'status' => 'active',
            ],
            // Max (German Shepherd) - Ear infection medications
            [
                'pet_name' => 'Max',
                'consultation_complaint' => 'Head shaking',
                'medication_name' => 'Otomax Ear Drops',
                'generic_name' => 'Gentamicin/Betamethasone/Clotrimazole',
                'dosage' => '4 drops per ear',
                'frequency' => 'Twice daily',
                'route' => 'Otic',
                'purpose' => 'Antibiotic/anti-inflammatory/antifungal ear treatment',
                'start_date' => Carbon::now()->subDays(60),
                'end_date' => Carbon::now()->subDays(46),
                'duration_days' => 14,
                'cost' => 680.00,
                'prescribed_by' => 'Dr. Santos',
                'instructions' => 'Clean ears before application. Massage ear base after applying.',
                'side_effects' => 'May cause temporary hearing changes',
                'notes' => 'Keep ears dry during treatment',
                'status' => 'completed',
            ],
            // Snowball (Rabbit) - Post dental procedure
            [
                'pet_name' => 'Snowball',
                'consultation_complaint' => 'Dental',
                'medication_name' => 'Meloxicam',
                'generic_name' => 'Meloxicam',
                'dosage' => '0.3mg/kg',
                'frequency' => 'Once daily',
                'route' => 'Oral',
                'purpose' => 'Pain relief post dental procedure',
                'start_date' => Carbon::now()->subDays(20),
                'end_date' => Carbon::now()->subDays(17),
                'duration_days' => 3,
                'cost' => 250.00,
                'prescribed_by' => 'Dr. Santos',
                'instructions' => 'Give in the morning with critical care food',
                'side_effects' => 'Monitor for decreased appetite',
                'notes' => 'Safe for rabbits at this dosage',
                'status' => 'completed',
            ],
            // Whiskers (Persian Cat) - Eye treatment
            [
                'pet_name' => 'Whiskers',
                'consultation_complaint' => 'Watery eyes',
                'medication_name' => 'Artificial Tears',
                'generic_name' => 'Polyethylene Glycol Eye Drops',
                'dosage' => '1-2 drops per eye',
                'frequency' => 'Three times daily',
                'route' => 'Ophthalmic',
                'purpose' => 'Lubrication for dry eyes',
                'start_date' => Carbon::now()->subDays(5),
                'end_date' => Carbon::now()->addDays(25),
                'duration_days' => 30,
                'cost' => 380.00,
                'prescribed_by' => 'Dr. Reyes',
                'instructions' => 'Clean eye area before application',
                'side_effects' => 'None expected',
                'notes' => 'May need long-term use for Persian breed',
                'status' => 'active',
            ],
            // Luna (Siamese Cat) - Hairball treatment
            [
                'pet_name' => 'Luna',
                'consultation_complaint' => 'Vomiting',
                'medication_name' => 'Laxatone',
                'generic_name' => 'Petroleum-based Hairball Remedy',
                'dosage' => '1 inch strip',
                'frequency' => 'Once daily',
                'route' => 'Oral',
                'purpose' => 'Hairball prevention and treatment',
                'start_date' => Carbon::now()->subDays(3),
                'end_date' => Carbon::now()->addDays(11),
                'duration_days' => 14,
                'cost' => 280.00,
                'prescribed_by' => 'Dr. Santos',
                'instructions' => 'Apply to paw or give directly. Most cats like the taste.',
                'side_effects' => 'May cause soft stool',
                'notes' => 'Can be used long-term 2-3 times weekly for prevention',
                'status' => 'active',
            ],
            [
                'pet_name' => 'Luna',
                'consultation_complaint' => 'Vomiting',
                'medication_name' => 'Metoclopramide',
                'generic_name' => 'Metoclopramide',
                'dosage' => '0.5mg/kg',
                'frequency' => 'Three times daily',
                'route' => 'Oral',
                'purpose' => 'Anti-nausea medication',
                'start_date' => Carbon::now()->subDays(3),
                'end_date' => Carbon::now()->addDays(4),
                'duration_days' => 7,
                'cost' => 320.00,
                'prescribed_by' => 'Dr. Santos',
                'instructions' => 'Give 30 minutes before meals',
                'side_effects' => 'May cause restlessness',
                'notes' => 'Short-term use only',
                'status' => 'active',
            ],
            // Cleo (Maine Coon) - Post-spay medications
            [
                'pet_name' => 'Cleo',
                'consultation_complaint' => 'spay',
                'medication_name' => 'Meloxicam',
                'generic_name' => 'Meloxicam',
                'dosage' => '0.05mg/kg',
                'frequency' => 'Once daily',
                'route' => 'Oral',
                'purpose' => 'Post-operative pain relief',
                'start_date' => Carbon::now()->subDays(25),
                'end_date' => Carbon::now()->subDays(20),
                'duration_days' => 5,
                'cost' => 380.00,
                'prescribed_by' => 'Dr. Santos',
                'instructions' => 'Give with food in the evening',
                'side_effects' => 'Monitor for decreased appetite',
                'notes' => null,
                'status' => 'completed',
            ],
            [
                'pet_name' => 'Cleo',
                'consultation_complaint' => 'spay',
                'medication_name' => 'Amoxicillin-Clavulanate',
                'generic_name' => 'Amoxicillin/Clavulanic Acid',
                'dosage' => '62.5mg',
                'frequency' => 'Twice daily',
                'route' => 'Oral',
                'purpose' => 'Antibiotic to prevent surgical site infection',
                'start_date' => Carbon::now()->subDays(25),
                'end_date' => Carbon::now()->subDays(18),
                'duration_days' => 7,
                'cost' => 420.00,
                'prescribed_by' => 'Dr. Santos',
                'instructions' => 'Complete full course even if cat seems better',
                'side_effects' => 'May cause GI upset',
                'notes' => 'Given with probiotic to prevent diarrhea',
                'status' => 'completed',
            ],
        ];

        foreach ($medications as $medicationData) {
            $pet = $pets->where('name', $medicationData['pet_name'])->first();

            if ($pet) {
                // Find related consultation
                $consultation = $pet->consultations()
                    ->where('chief_complaint', 'like', '%' . $medicationData['consultation_complaint'] . '%')
                    ->first();

                Medication::firstOrCreate(
                    [
                        'pet_id' => $pet->id,
                        'medication_name' => $medicationData['medication_name'],
                        'start_date' => $medicationData['start_date'],
                    ],
                    [
                        'pet_id' => $pet->id,
                        'consultation_id' => $consultation?->id,
                        'medication_name' => $medicationData['medication_name'],
                        'generic_name' => $medicationData['generic_name'],
                        'dosage' => $medicationData['dosage'],
                        'frequency' => $medicationData['frequency'],
                        'route' => $medicationData['route'],
                        'purpose' => $medicationData['purpose'],
                        'start_date' => $medicationData['start_date'],
                        'end_date' => $medicationData['end_date'],
                        'duration_days' => $medicationData['duration_days'],
                        'cost' => $medicationData['cost'],
                        'prescribed_by' => $medicationData['prescribed_by'],
                        'instructions' => $medicationData['instructions'],
                        'side_effects' => $medicationData['side_effects'],
                        'notes' => $medicationData['notes'],
                        'status' => $medicationData['status'],
                    ]
                );
            }
        }
    }
}
