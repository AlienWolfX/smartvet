<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = config('app.admin_email', 'admin@smartvet.local');
        $password = config('app.admin_password', 'admin123');

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => 'SmartVet Administrator',
                'clinic_name' => 'SmartVet Veterinary Clinic',
                'password' => Hash::make($password),
                'role' => 'admin',
                'status' => 'active',
                'is_setup_complete' => true,
            ]
        );
    }
}
