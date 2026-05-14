<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (Auth::check()) {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if ($user->isOwner())  return redirect()->route('owner.pets');
        if ($user->isClinic()) return redirect()->route('dashboard');
        if ($user->isAdmin())  return redirect()->route('admin.user-management');
    }
    return redirect()->route('login');
})->name('home');

// Smart portal home (used as Fortify's home redirect)
Route::get('portal-home', function () {
    if (Auth::check()) {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if ($user->isOwner())  return redirect()->route('owner.pets');
        if ($user->isClinic()) return redirect()->route('dashboard');
        if ($user->isAdmin())  return redirect()->route('admin.user-management');
    }
    return redirect()->route('login');
})->name('portal.home');

// Owner self-registration
Route::middleware('guest')->group(function () {
    Route::get('register', [App\Http\Controllers\OwnerRegisterController::class, 'showForm'])->name('owner.register');
    Route::post('register', [App\Http\Controllers\OwnerRegisterController::class, 'register'])->name('owner.register.submit');
});

// Email verification after register
Route::middleware('auth')->group(function () {
    Route::get('email/verify', [App\Http\Controllers\EmailVerificationController::class, 'showVerificationNotice'])->name('verification.notice');
    Route::post('email/verify', [App\Http\Controllers\EmailVerificationController::class, 'verify'])->name('verification.verify');
    Route::post('email/verification-notification', [App\Http\Controllers\EmailVerificationController::class, 'resend'])->name('verification.send');
});

// Admin login routes
Route::middleware('guest')->group(function () {
    Route::get('admin', [App\Http\Controllers\AdminAuthController::class, 'showLoginForm'])->name('admin.login');
    Route::post('admin/login', [App\Http\Controllers\AdminAuthController::class, 'login'])->name('admin.login.submit');
});
Route::post('admin/logout', [App\Http\Controllers\AdminAuthController::class, 'logout'])
    ->name('admin.logout')
    ->middleware('auth');

// Clinic login routes
Route::middleware('guest')->group(function () {
    Route::get('clinic', [App\Http\Controllers\ClinicAuthController::class, 'showLoginForm'])->name('clinic.login');
    Route::post('clinic/login', [App\Http\Controllers\ClinicAuthController::class, 'login'])->name('clinic.login.submit');
});
Route::post('clinic/logout', [App\Http\Controllers\ClinicAuthController::class, 'logout'])
    ->name('clinic.logout')
    ->middleware('auth');

// Owner portal routes
Route::middleware(['auth', 'role:owner', \App\Http\Middleware\EnsureEmailIsVerified::class])->prefix('owner')->group(function () {
    Route::get('pets', [App\Http\Controllers\OwnerPortalController::class, 'myPets'])->name('owner.pets');
    Route::get('settings', [App\Http\Controllers\OwnerPortalController::class, 'settings'])->name('owner.settings');
    Route::get('settings/appearance', [App\Http\Controllers\AppearanceSettingsController::class, 'ownerEdit'])->name('owner.settings.appearance');
    Route::post('settings/appearance', [App\Http\Controllers\AppearanceSettingsController::class, 'ownerUpdate'])->name('owner.settings.appearance.update');
    Route::get('pets/{pet}/record', [App\Http\Controllers\OwnerPortalController::class, 'petRecord'])->name('owner.pet.record');
    Route::put('pets/{pet}', [App\Http\Controllers\OwnerPortalController::class, 'updatePet'])->name('owner.pet.update');
});

// Public pet QR scan page (no auth required)
Route::get('scan/{token}', [App\Http\Controllers\PetScanController::class, 'scan'])->name('pet.scan');

Route::middleware(['auth', \App\Http\Middleware\EnsureEmailIsVerified::class])->group(function () {
    // Setup route (must be before EnsureSetupComplete middleware check)
    Route::get('setup', [App\Http\Controllers\SetupController::class, 'show'])->name('setup');
    Route::post('setup', [App\Http\Controllers\SetupController::class, 'store'])->name('setup.store');
    Route::post('onboarding/complete', [App\Http\Controllers\OnboardingController::class, 'complete'])->name('onboarding.complete');

    // Clinic-only routes
    Route::middleware(['role:clinic', \App\Http\Middleware\EnsureEmailIsVerified::class])->group(function () {
        Route::get('dashboard', [App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
        Route::get('inventory-management', [App\Http\Controllers\InventoryController::class, 'index'])->name('inventory-management');
        Route::post('inventory-management', [App\Http\Controllers\InventoryController::class, 'store'])->name('inventory-management.store');
        Route::put('inventory-management/{item}', [App\Http\Controllers\InventoryController::class, 'update'])->name('inventory-management.update');
        Route::post('inventory-management/{item}/restock', [App\Http\Controllers\InventoryController::class, 'restock'])->name('inventory-management.restock');
        Route::delete('inventory-management/{item}', [App\Http\Controllers\InventoryController::class, 'destroy'])->name('inventory-management.destroy');
        Route::get('inventory-management/export', [App\Http\Controllers\InventoryController::class, 'export'])->name('inventory-management.export');

        Route::get('medication-sales', [App\Http\Controllers\MedicationSalesController::class, 'index'])->name('medication-sales');
        Route::post('medication-sales', [App\Http\Controllers\MedicationSalesController::class, 'store'])->name('medication-sales.store');

        Route::get('pet-records', [App\Http\Controllers\PetController::class, 'index'])->name('pet-records');
        Route::get('pet-records/export', [App\Http\Controllers\PetController::class, 'export'])->name('pet-records.export');
        Route::get('pet-records/scan', [App\Http\Controllers\PetController::class, 'scannerPage'])->name('pet-records.scan');
        Route::get('pet-records/scan-lookup/{token}', [App\Http\Controllers\PetScanController::class, 'clinicScan'])->name('pet-records.scan-lookup');
        Route::post('pet-records', [App\Http\Controllers\PetController::class, 'store'])->name('pet-records.store');
        Route::get('pet-records/{pet}/manage', [App\Http\Controllers\PetController::class, 'manage'])->name('pet-records.manage');
        Route::put('pet-records/{pet}', [App\Http\Controllers\PetController::class, 'update'])->name('pet-records.update');
        Route::delete('pet-records/{pet}', [App\Http\Controllers\PetController::class, 'destroy'])->name('pet-records.destroy');
        Route::post('pet-records/{pet}/consultations', [App\Http\Controllers\ConsultationController::class, 'store'])->name('consultations.store');
        Route::post('pet-records/{pet}/vaccinations', [App\Http\Controllers\VaccinationController::class, 'store'])->name('vaccinations.store');
        Route::put('pet-records/{pet}/vaccinations/{vaccination}', [App\Http\Controllers\VaccinationController::class, 'update'])->name('vaccinations.update');
        Route::post('pet-records/{pet}/medications', [App\Http\Controllers\MedicationController::class, 'store'])->name('medications.store');

        // Notifications API
        Route::get('notifications/inventory', [App\Http\Controllers\NotificationController::class, 'index'])->name('notifications.inventory');
        Route::post('notifications/dismiss', [App\Http\Controllers\NotificationController::class, 'dismiss'])->name('notifications.dismiss');
        Route::post('notifications/dismiss-all', [App\Http\Controllers\NotificationController::class, 'dismissAll'])->name('notifications.dismiss-all');

        Route::get('reports', [App\Http\Controllers\ReportsController::class, 'index'])->name('reports');
        Route::get('reports/export/financial', [App\Http\Controllers\ReportsController::class, 'exportFinancial'])->name('reports.export.financial');
        Route::get('reports/export/service', [App\Http\Controllers\ReportsController::class, 'exportService'])->name('reports.export.service');

        Route::get('clinic-settings', [App\Http\Controllers\ClinicSettingsController::class, 'index'])->name('clinic-settings');
        Route::post('clinic-settings', [App\Http\Controllers\ClinicSettingsController::class, 'update'])->name('clinic-settings.update');

        Route::get('billing', [App\Http\Controllers\BillingController::class, 'index'])->name('billing');
        Route::post('billing/process/{payment}', [App\Http\Controllers\BillingController::class, 'processPayment'])->name('billing.process');

        Route::get('consultation-types', [App\Http\Controllers\ConsultationTypeController::class, 'index'])->name('consultation-types.index');
        Route::post('consultation-types', [App\Http\Controllers\ConsultationTypeController::class, 'store'])->name('consultation-types.store');
        Route::put('consultation-types/{consultationType}', [App\Http\Controllers\ConsultationTypeController::class, 'update'])->name('consultation-types.update');
        Route::delete('consultation-types/{consultationType}', [App\Http\Controllers\ConsultationTypeController::class, 'destroy'])->name('consultation-types.destroy');
    });

    // Admin-only routes
    Route::middleware(['role:admin'])->group(function () {
        Route::get('user-management', [App\Http\Controllers\UserController::class, 'index'])->name('admin.user-management');
        Route::get('user-management/export', [App\Http\Controllers\UserController::class, 'export'])->name('admin.user-management.export');
        Route::post('user-management', [App\Http\Controllers\UserController::class, 'store'])->name('admin.user-management.store');
        Route::put('user-management/{user}', [App\Http\Controllers\UserController::class, 'update'])->name('admin.user-management.update');
        Route::patch('user-management/{user}/toggle-status', [App\Http\Controllers\UserController::class, 'toggleStatus'])->name('admin.user-management.toggle-status');
        Route::delete('user-management/{user}', [App\Http\Controllers\UserController::class, 'destroy'])->name('admin.user-management.destroy');

        // Owner account management
        Route::get('owner-management', [App\Http\Controllers\OwnerManagementController::class, 'index'])->name('admin.owner-management');
        Route::put('owner-management/{owner}', [App\Http\Controllers\OwnerManagementController::class, 'update'])->name('admin.owner-management.update');
        Route::patch('owner-management/{owner}/toggle-status', [App\Http\Controllers\OwnerManagementController::class, 'toggleStatus'])->name('admin.owner-management.toggle-status');
        Route::delete('owner-management/{owner}', [App\Http\Controllers\OwnerManagementController::class, 'destroy'])->name('admin.owner-management.destroy');

        // Clinic visibility management
        Route::get('clinic-visibility', [App\Http\Controllers\ClinicVisibilityController::class, 'index'])->name('admin.clinic-visibility');
        Route::get('clinic-visibility/{clinic}/permissions', [App\Http\Controllers\ClinicVisibilityController::class, 'getPermissions'])->name('admin.clinic-visibility.permissions');
        Route::post('clinic-visibility/grant-permission', [App\Http\Controllers\ClinicVisibilityController::class, 'grantPermission'])->name('admin.clinic-visibility.grant');
        Route::post('clinic-visibility/revoke-permission', [App\Http\Controllers\ClinicVisibilityController::class, 'revokePermission'])->name('admin.clinic-visibility.revoke');

        Route::get('admin/settings', [App\Http\Controllers\AppearanceSettingsController::class, 'adminEdit'])->name('admin.admin-settings');
        Route::post('admin/settings', [App\Http\Controllers\AppearanceSettingsController::class, 'adminUpdate'])->name('admin.admin-settings.update');
    });
});

// Activity update route (for keeping session alive)
Route::post('activity/ping', function () {
    return response()->json(['success' => true]);
})->middleware('auth')->name('activity.ping');

require __DIR__.'/settings.php';
