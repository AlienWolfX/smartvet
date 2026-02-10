<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Owner;

class OwnerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $owners = [
            [
                'name' => 'Juan Dela Cruz',
                'phone' => '09171234567',
                'email' => 'juan.delacruz@email.com',
                'street' => '123 Rizal Street',
                'barangay' => 'Barangay Holy Spirit',
                'city' => 'Quezon City',
                'province' => 'NCR',
                'zip_code' => '1127',
                'address' => '123 Rizal Street, Barangay Holy Spirit, Quezon City, NCR, 1127',
                'emergency_contact' => '09181234567',
            ],
            [
                'name' => 'Maria Santos',
                'phone' => '09182345678',
                'email' => 'maria.santos@email.com',
                'street' => '456 Bonifacio Avenue',
                'barangay' => 'Barangay Poblacion',
                'city' => 'City of Makati',
                'province' => 'NCR',
                'zip_code' => '1210',
                'address' => '456 Bonifacio Avenue, Barangay Poblacion, City of Makati, NCR, 1210',
                'emergency_contact' => '09192345678',
            ],
            [
                'name' => 'Pedro Reyes',
                'phone' => '09193456789',
                'email' => 'pedro.reyes@email.com',
                'street' => '789 Mabini Street',
                'barangay' => 'Barangay Ermita',
                'city' => 'City of Manila',
                'province' => 'NCR',
                'zip_code' => '1000',
                'address' => '789 Mabini Street, Barangay Ermita, City of Manila, NCR, 1000',
                'emergency_contact' => '09173456789',
            ],
            [
                'name' => 'Ana Garcia',
                'phone' => '09174567890',
                'email' => 'ana.garcia@email.com',
                'street' => '321 Luna Street',
                'barangay' => 'Barangay Kapitolyo',
                'city' => 'City of Pasig',
                'province' => 'NCR',
                'zip_code' => '1603',
                'address' => '321 Luna Street, Barangay Kapitolyo, City of Pasig, NCR, 1603',
                'emergency_contact' => '09184567890',
            ],
            [
                'name' => 'Carlos Mendoza',
                'phone' => '09185678901',
                'email' => 'carlos.mendoza@email.com',
                'street' => '654 Del Pilar Street',
                'barangay' => 'Barangay Western Bicutan',
                'city' => 'City of Taguig',
                'province' => 'NCR',
                'zip_code' => '1630',
                'address' => '654 Del Pilar Street, Barangay Western Bicutan, City of Taguig, NCR, 1630',
                'emergency_contact' => '09195678901',
            ],
            [
                'name' => 'Elena Torres',
                'phone' => '09196789012',
                'email' => 'elena.torres@email.com',
                'street' => '987 Aguinaldo Highway',
                'barangay' => 'Barangay Habay I',
                'city' => 'City of Bacoor',
                'province' => 'Cavite',
                'zip_code' => '4102',
                'address' => '987 Aguinaldo Highway, Barangay Habay I, City of Bacoor, Cavite, 4102',
                'emergency_contact' => '09176789012',
            ],
            [
                'name' => 'Roberto Lim',
                'phone' => '09177890123',
                'email' => 'roberto.lim@email.com',
                'street' => '147 Roxas Boulevard',
                'barangay' => 'Barangay Baclaran',
                'city' => 'City of Pasay',
                'province' => 'NCR',
                'zip_code' => '1300',
                'address' => '147 Roxas Boulevard, Barangay Baclaran, City of Pasay, NCR, 1300',
                'emergency_contact' => '09187890123',
            ],
            [
                'name' => 'Sofia Cruz',
                'phone' => '09188901234',
                'email' => 'sofia.cruz@email.com',
                'street' => '258 EDSA',
                'barangay' => 'Barangay Wack-Wack Greenhills',
                'city' => 'City of Mandaluyong',
                'province' => 'NCR',
                'zip_code' => '1550',
                'address' => '258 EDSA, Barangay Wack-Wack Greenhills, City of Mandaluyong, NCR, 1550',
                'emergency_contact' => '09198901234',
            ],
        ];

        foreach ($owners as $owner) {
            Owner::firstOrCreate(
                ['email' => $owner['email']],
                $owner
            );
        }
    }
}
