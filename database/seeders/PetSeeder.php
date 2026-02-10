<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pet;
use App\Models\Owner;
use App\Models\PetSpecies;

class PetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $owners = Owner::all();
        $species = PetSpecies::all()->keyBy('name');

        $pets = [
            // Juan Dela Cruz's pets
            [
                'name' => 'Bantay',
                'owner_email' => 'juan.delacruz@email.com',
                'species' => 'Dog',
                'breed' => 'Aspin',
                'age' => 3,
                'weight' => 12.50,
                'gender' => 'male',
                'color' => 'Brown',
                'microchip_id' => 'PH-DOG-001',
                'status' => 'active',
            ],
            [
                'name' => 'Mingming',
                'owner_email' => 'juan.delacruz@email.com',
                'species' => 'Cat',
                'breed' => 'Puspin',
                'age' => 2,
                'weight' => 4.20,
                'gender' => 'female',
                'color' => 'Orange Tabby',
                'microchip_id' => 'PH-CAT-001',
                'status' => 'active',
            ],
            // Maria Santos's pets
            [
                'name' => 'Bruno',
                'owner_email' => 'maria.santos@email.com',
                'species' => 'Dog',
                'breed' => 'Golden Retriever',
                'age' => 5,
                'weight' => 28.00,
                'gender' => 'male',
                'color' => 'Golden',
                'microchip_id' => 'PH-DOG-002',
                'status' => 'active',
            ],
            [
                'name' => 'Tweety',
                'owner_email' => 'maria.santos@email.com',
                'species' => 'Bird',
                'breed' => 'Cockatiel',
                'age' => 1,
                'weight' => 0.10,
                'gender' => 'female',
                'color' => 'Yellow and Grey',
                'microchip_id' => null,
                'status' => 'active',
            ],
            // Pedro Reyes's pets
            [
                'name' => 'Max',
                'owner_email' => 'pedro.reyes@email.com',
                'species' => 'Dog',
                'breed' => 'German Shepherd',
                'age' => 4,
                'weight' => 35.00,
                'gender' => 'male',
                'color' => 'Black and Tan',
                'microchip_id' => 'PH-DOG-003',
                'status' => 'active',
            ],
            // Ana Garcia's pets
            [
                'name' => 'Snowball',
                'owner_email' => 'ana.garcia@email.com',
                'species' => 'Rabbit',
                'breed' => 'Holland Lop',
                'age' => 2,
                'weight' => 1.80,
                'gender' => 'female',
                'color' => 'White',
                'microchip_id' => null,
                'status' => 'active',
            ],
            [
                'name' => 'Whiskers',
                'owner_email' => 'ana.garcia@email.com',
                'species' => 'Cat',
                'breed' => 'Persian',
                'age' => 3,
                'weight' => 5.50,
                'gender' => 'male',
                'color' => 'White',
                'microchip_id' => 'PH-CAT-002',
                'status' => 'active',
            ],
            // Carlos Mendoza's pets
            [
                'name' => 'Rocky',
                'owner_email' => 'carlos.mendoza@email.com',
                'species' => 'Dog',
                'breed' => 'Bulldog',
                'age' => 6,
                'weight' => 22.00,
                'gender' => 'male',
                'color' => 'Brindle',
                'microchip_id' => 'PH-DOG-004',
                'status' => 'active',
            ],
            [
                'name' => 'Hammy',
                'owner_email' => 'carlos.mendoza@email.com',
                'species' => 'Hamster',
                'breed' => 'Syrian Hamster',
                'age' => 1,
                'weight' => 0.15,
                'gender' => 'male',
                'color' => 'Golden',
                'microchip_id' => null,
                'status' => 'active',
            ],
            // Elena Torres's pets
            [
                'name' => 'Luna',
                'owner_email' => 'elena.torres@email.com',
                'species' => 'Cat',
                'breed' => 'Siamese',
                'age' => 2,
                'weight' => 3.80,
                'gender' => 'female',
                'color' => 'Cream and Brown',
                'microchip_id' => 'PH-CAT-003',
                'status' => 'active',
            ],
            // Roberto Lim's pets
            [
                'name' => 'Spike',
                'owner_email' => 'roberto.lim@email.com',
                'species' => 'Turtle',
                'breed' => 'Red-Eared Slider',
                'age' => 8,
                'weight' => 1.20,
                'gender' => 'male',
                'color' => 'Green',
                'microchip_id' => null,
                'status' => 'active',
            ],
            [
                'name' => 'Buddy',
                'owner_email' => 'roberto.lim@email.com',
                'species' => 'Dog',
                'breed' => 'Beagle',
                'age' => 4,
                'weight' => 10.50,
                'gender' => 'male',
                'color' => 'Tricolor',
                'microchip_id' => 'PH-DOG-005',
                'status' => 'active',
            ],
            // Sofia Cruz's pets
            [
                'name' => 'Cleo',
                'owner_email' => 'sofia.cruz@email.com',
                'species' => 'Cat',
                'breed' => 'Maine Coon',
                'age' => 3,
                'weight' => 7.00,
                'gender' => 'female',
                'color' => 'Brown Tabby',
                'microchip_id' => 'PH-CAT-004',
                'status' => 'active',
            ],
            [
                'name' => 'Draco',
                'owner_email' => 'sofia.cruz@email.com',
                'species' => 'Lizard',
                'breed' => 'Bearded Dragon',
                'age' => 2,
                'weight' => 0.45,
                'gender' => 'male',
                'color' => 'Orange',
                'microchip_id' => null,
                'status' => 'active',
            ],
        ];

        foreach ($pets as $petData) {
            $owner = Owner::where('email', $petData['owner_email'])->first();
            $petSpecies = $species->get($petData['species']);

            if ($owner && $petSpecies) {
                Pet::firstOrCreate(
                    ['microchip_id' => $petData['microchip_id'] ?? null, 'name' => $petData['name'], 'owner_id' => $owner->id],
                    [
                        'name' => $petData['name'],
                        'owner_id' => $owner->id,
                        'species_id' => $petSpecies->id,
                        'breed' => $petData['breed'],
                        'age' => $petData['age'],
                        'weight' => $petData['weight'],
                        'gender' => $petData['gender'],
                        'color' => $petData['color'],
                        'microchip_id' => $petData['microchip_id'],
                        'status' => $petData['status'],
                    ]
                );
            }
        }
    }
}
