<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PetSpecies;

class PetSpeciesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $species = [
            ['name' => 'Dog', 'icon' => '🐕'],
            ['name' => 'Cat', 'icon' => '🐱'],
            ['name' => 'Bird', 'icon' => '🐦'],
            ['name' => 'Rabbit', 'icon' => '🐰'],
            ['name' => 'Hamster', 'icon' => '🐹'],
            ['name' => 'Fish', 'icon' => '🐠'],
            ['name' => 'Turtle', 'icon' => '🐢'],
            ['name' => 'Lizard', 'icon' => '🦎'],
        ];

        foreach ($species as $speciesData) {
            PetSpecies::firstOrCreate(
                ['name' => $speciesData['name']], 
                $speciesData
            );
        }
    }
}
