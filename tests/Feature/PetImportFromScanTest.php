<?php

use App\Models\Pet;
use App\Models\User;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\post;

it('keeps the scanned qr token when importing a missing pet', function () {
    $user = User::factory()->create([
        'role' => User::ROLE_CLINIC,
        'email_verified_at' => now(),
        'is_setup_complete' => true,
    ]);

    actingAs($user);

    $qrToken = '550e8400-e29b-41d4-a716-446655440000';

    $response = post(route('pet-records.store'), [
        'petName' => 'Buddy',
        'species' => 'Dog',
        'breed' => 'Labrador',
        'age' => 3,
        'weight' => 18.5,
        'gender' => 'male',
        'color' => 'Golden',
        'microchipId' => 'MC-10001',
        'qrToken' => $qrToken,
        'ownerName' => 'Jane Doe',
        'phone' => '09171234567',
        'email' => 'jane@example.com',
        'province' => 'Laguna',
        'city' => 'Calamba',
        'barangay' => 'Poblacion',
        'street' => '123 Main St',
        'zipCode' => '4027',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success', 'Pet registered successfully!');

    $pet = Pet::query()->where('qr_token', $qrToken)->first();

    expect($pet)->not->toBeNull();
    expect($pet?->name)->toBe('Buddy');
    expect($pet?->microchip_id)->toBe('MC-10001');
});
