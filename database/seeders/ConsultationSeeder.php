<?php

namespace Database\Seeders;

use App\Models\Consultation;
use App\Models\Pet;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ConsultationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $petsByName = Pet::query()
            ->get()
            ->keyBy(fn (Pet $pet) => strtolower($pet->name));

        $consultations = [
            // Bantay (Dog) - Multiple consultations
            [
                'pet_name' => 'Bantay',
                'consultation_date' => Carbon::today()->subDays(30),
                'consultation_time' => '09:00:00',
                'consultation_type' => 'routine-checkup',
                'chief_complaint' => 'Annual checkup - routine wellness visit',
                'diagnosis' => 'Healthy - no issues found',
                'treatment' => 'Administered annual vaccinations, deworming',
                'notes' => 'Owner advised to continue current diet. Pet is in excellent health. Weight: 12.50kg, Temp: 38.5 C, HR: 100bpm',
                'consultation_fee' => 500.00,
                'veterinarian' => 'Dr. Santos',
                'status' => 'completed',
                'payment_status' => 'paid',
            ],
            [
                'pet_name' => 'Bantay',
                'consultation_date' => Carbon::today()->subDays(7),
                'consultation_time' => '14:30:00',
                'consultation_type' => 'routine-checkup',
                'chief_complaint' => 'Skin irritation - Excessive scratching, red patches on belly',
                'diagnosis' => 'Allergic dermatitis',
                'treatment' => 'Prescribed antihistamines and medicated shampoo',
                'notes' => 'Possible food allergy. Recommended hypoallergenic diet trial. Weight: 12.80kg, Temp: 38.7 C',
                'consultation_fee' => 600.00,
                'veterinarian' => 'Dr. Santos',
                'status' => 'completed',
                'payment_status' => 'paid',
            ],
            // Mingming (Cat)
            [
                'pet_name' => 'Mingming',
                'consultation_date' => Carbon::today()->subDays(45),
                'consultation_time' => '10:00:00',
                'consultation_type' => 'vaccination',
                'chief_complaint' => 'Routine vaccination visit',
                'diagnosis' => 'Healthy',
                'treatment' => 'Administered FVRCP vaccine',
                'notes' => 'Cat is healthy and active. Good body condition. Weight: 4.20kg',
                'consultation_fee' => 450.00,
                'veterinarian' => 'Dr. Santos',
                'status' => 'completed',
                'payment_status' => 'paid',
            ],
            // Bruno (Golden Retriever)
            [
                'pet_name' => 'Bruno',
                'consultation_date' => Carbon::today()->subDays(14),
                'consultation_time' => '11:00:00',
                'consultation_type' => 'routine-checkup',
                'chief_complaint' => 'Limping on right hind leg, reluctance to jump, mild pain on palpation',
                'diagnosis' => 'Mild hip dysplasia',
                'treatment' => 'Prescribed NSAIDs, joint supplements, weight management plan',
                'notes' => 'X-rays taken. Recommend swimming as low-impact exercise. Avoid stairs. Weight: 29.00kg',
                'consultation_fee' => 1500.00,
                'veterinarian' => 'Dr. Reyes',
                'status' => 'completed',
                'payment_status' => 'pending',
            ],
            // Max (German Shepherd)
            [
                'pet_name' => 'Max',
                'consultation_date' => Carbon::today()->subDays(60),
                'consultation_time' => '09:30:00',
                'consultation_type' => 'routine-checkup',
                'chief_complaint' => 'Head shaking, scratching ears, foul odor from ears',
                'diagnosis' => 'Bacterial otitis externa',
                'treatment' => 'Ear cleaning, prescribed ear drops (antibiotics)',
                'notes' => 'Both ears affected. Owner instructed on proper ear cleaning technique. Weight: 35.50kg',
                'consultation_fee' => 800.00,
                'veterinarian' => 'Dr. Santos',
                'status' => 'completed',
                'payment_status' => 'paid',
            ],
            [
                'pet_name' => 'Max',
                'consultation_date' => Carbon::today()->subDays(45),
                'consultation_time' => '10:30:00',
                'consultation_type' => 'follow-up',
                'chief_complaint' => 'Follow-up for ear infection - Improved, minimal scratching',
                'diagnosis' => 'Ear infection resolved',
                'treatment' => 'Continue ear maintenance cleaning weekly',
                'notes' => 'Infection cleared. Advised regular ear cleaning to prevent recurrence. Weight: 35.20kg',
                'consultation_fee' => 300.00,
                'veterinarian' => 'Dr. Santos',
                'status' => 'completed',
                'payment_status' => 'paid',
            ],
            // Snowball (Rabbit)
            [
                'pet_name' => 'Snowball',
                'consultation_date' => Carbon::today()->subDays(20),
                'consultation_time' => '15:00:00',
                'consultation_type' => 'surgery',
                'chief_complaint' => 'Dental checkup - Decreased appetite, drooling',
                'diagnosis' => 'Overgrown molars',
                'treatment' => 'Dental filing performed under sedation',
                'notes' => 'Molars trimmed. Recommend more hay in diet to promote natural tooth wear. Weight: 1.75kg',
                'consultation_fee' => 2500.00,
                'veterinarian' => 'Dr. Santos',
                'status' => 'completed',
                'payment_status' => 'paid',
            ],
            // Whiskers (Persian Cat)
            [
                'pet_name' => 'Whiskers',
                'consultation_date' => Carbon::today()->subDays(5),
                'consultation_time' => '13:00:00',
                'consultation_type' => 'routine-checkup',
                'chief_complaint' => 'Watery eyes, mild redness, excessive tearing',
                'diagnosis' => 'Epiphora (tear overflow) - common in Persian cats',
                'treatment' => 'Eye cleaning solution, artificial tears',
                'notes' => 'Brachycephalic breed prone to eye issues. Daily eye cleaning recommended. Weight: 5.60kg',
                'consultation_fee' => 500.00,
                'veterinarian' => 'Dr. Reyes',
                'status' => 'completed',
                'payment_status' => 'pending',
            ],
            // Rocky (Bulldog)
            [
                'pet_name' => 'Rocky',
                'consultation_date' => Carbon::today()->subDays(90),
                'consultation_time' => '11:30:00',
                'consultation_type' => 'routine-checkup',
                'chief_complaint' => 'Snoring, labored breathing during exercise, overheating',
                'diagnosis' => 'Brachycephalic obstructive airway syndrome (BOAS)',
                'treatment' => 'Weight management, avoid strenuous exercise, cool environment',
                'notes' => 'Mild case. Surgery not recommended at this time. Monitor closely. Weight: 23.00kg',
                'consultation_fee' => 700.00,
                'veterinarian' => 'Dr. Santos',
                'status' => 'completed',
                'payment_status' => 'paid',
            ],
            // Luna (Siamese Cat)
            [
                'pet_name' => 'Luna',
                'consultation_date' => Carbon::today()->subDays(3),
                'consultation_time' => '16:00:00',
                'consultation_type' => 'emergency',
                'chief_complaint' => 'Vomiting 2-3 times daily, lethargy, decreased appetite',
                'diagnosis' => 'Hairball-related gastritis',
                'treatment' => 'Hairball remedy paste, dietary fiber supplement',
                'notes' => 'Recommended regular brushing and hairball prevention diet. Weight: 3.70kg',
                'consultation_fee' => 800.00,
                'veterinarian' => 'Dr. Santos',
                'status' => 'completed',
                'payment_status' => 'pending',
            ],
            // Buddy (Beagle)
            [
                'pet_name' => 'Buddy',
                'consultation_date' => Carbon::today()->subDays(10),
                'consultation_time' => '10:00:00',
                'consultation_type' => 'routine-checkup',
                'chief_complaint' => 'Annual wellness exam - routine checkup',
                'diagnosis' => 'Healthy with mild tartar buildup',
                'treatment' => 'Vaccinations updated, dental cleaning recommended',
                'notes' => 'Good overall health. Schedule dental cleaning within 3 months. Weight: 10.80kg',
                'consultation_fee' => 500.00,
                'veterinarian' => 'Dr. Reyes',
                'status' => 'completed',
                'payment_status' => 'paid',
            ],
            // Cleo (Maine Coon)
            [
                'pet_name' => 'Cleo',
                'consultation_date' => Carbon::today()->subDays(25),
                'consultation_time' => '08:00:00',
                'consultation_type' => 'surgery',
                'chief_complaint' => 'Elective spay surgery',
                'diagnosis' => 'Healthy for surgery',
                'treatment' => 'Ovariohysterectomy performed successfully',
                'notes' => 'Surgery went well. Pain medication prescribed for 5 days. E-collar required. Weight: 6.90kg',
                'consultation_fee' => 3500.00,
                'veterinarian' => 'Dr. Santos',
                'status' => 'completed',
                'payment_status' => 'paid',
            ],
        ];

        $latestVisitByPet = [];

        foreach ($consultations as $consultationData) {
            $pet = $petsByName->get(strtolower($consultationData['pet_name']));

            if (! $pet) {
                continue;
            }

            $consultationDate = Carbon::parse($consultationData['consultation_date'])->toDateString();

            Consultation::updateOrCreate(
                [
                    'pet_id' => $pet->id,
                    'consultation_date' => $consultationDate,
                    'consultation_time' => $consultationData['consultation_time'],
                    'consultation_type' => $consultationData['consultation_type'],
                ],
                [
                    'chief_complaint' => $consultationData['chief_complaint'],
                    'diagnosis' => $consultationData['diagnosis'],
                    'treatment' => $consultationData['treatment'],
                    'notes' => $consultationData['notes'],
                    'consultation_fee' => $consultationData['consultation_fee'],
                    'veterinarian' => $consultationData['veterinarian'],
                    'status' => $consultationData['status'],
                    'payment_status' => $consultationData['payment_status'],
                ]
            );

            $latestVisitByPet[$pet->id] = isset($latestVisitByPet[$pet->id])
                ? max($latestVisitByPet[$pet->id], $consultationDate)
                : $consultationDate;
        }

        foreach ($latestVisitByPet as $petId => $lastVisitDate) {
            Pet::whereKey($petId)->update(['last_visit' => $lastVisitDate]);
        }
    }
}
