<?php

namespace Database\Seeders;

use App\Models\ConsultationType;
use App\Models\User;
use Illuminate\Database\Seeder;

class ConsultationTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminUser = User::where('role', 'admin')->first();
        if (! $adminUser) {
            return;
        }

        $types = [
            ['name' => 'General Check-up', 'fee' => 300.00, 'description' => 'Routine wellness exam', 'slug' => 'routine-checkup'],
            ['name' => 'Emergency', 'fee' => 800.00, 'description' => 'Urgent care visit', 'slug' => 'emergency'],
            ['name' => 'Follow-up', 'fee' => 150.00, 'description' => 'Review appointment after treatment', 'slug' => 'follow-up'],
            ['name' => 'Surgery Evaluation', 'fee' => 500.00, 'description' => 'Pre-surgical consultation', 'slug' => 'surgery'],
            ['name' => 'Vaccination', 'fee' => 0.00, 'description' => 'Vaccine appointment', 'slug' => 'vaccination'],
        ];

        foreach ($types as $type) {
            ConsultationType::updateOrCreate(
                [
                    'user_id' => $adminUser->id,
                    'slug' => $type['slug'],
                ],
                [
                    'name' => $type['name'],
                    'fee' => $type['fee'],
                    'description' => $type['description'],
                ]
            );
        }
    }
}
