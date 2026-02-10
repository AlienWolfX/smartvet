<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\InventoryCategory;

class InventoryCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Vaccines', 'slug' => 'vaccines', 'icon' => '💉'],
            ['name' => 'Medications', 'slug' => 'medications', 'icon' => '💊'],
            ['name' => 'Surgical Supplies', 'slug' => 'surgical-supplies', 'icon' => '🔪'],
            ['name' => 'Laboratory Supplies', 'slug' => 'laboratory-supplies', 'icon' => '🧪'],
            ['name' => 'Pet Food', 'slug' => 'pet-food', 'icon' => '🍖'],
            ['name' => 'Grooming Supplies', 'slug' => 'grooming-supplies', 'icon' => '✂️'],
            ['name' => 'Medical Equipment', 'slug' => 'medical-equipment', 'icon' => '🩺'],
            ['name' => 'Cleaning Supplies', 'slug' => 'cleaning-supplies', 'icon' => '🧴'],
        ];

        foreach ($categories as $category) {
            InventoryCategory::firstOrCreate(
                ['slug' => $category['slug']],
                $category
            );
        }
    }
}
