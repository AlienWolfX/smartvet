<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            // Users & Auth
            AdminUserSeeder::class,

            // Pet Species (lookup table)
            PetSpeciesSeeder::class,

            // Owners & Pets
            OwnerSeeder::class,
            PetSeeder::class,

            // Inventory
            InventoryCategorySeeder::class,
            InventoryItemSeeder::class,

            // Consultation Types
            ConsultationTypeSeeder::class,

            // Medical Records
            ConsultationSeeder::class,
            VaccinationSeeder::class,
            MedicationSeeder::class,
        ]);
    }
}
