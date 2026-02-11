<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

    Route::get('inventory-management', [App\Http\Controllers\InventoryController::class, 'index'])->name('inventory-management');
    Route::post('inventory-management', [App\Http\Controllers\InventoryController::class, 'store'])->name('inventory-management.store');
    Route::put('inventory-management/{item}', [App\Http\Controllers\InventoryController::class, 'update'])->name('inventory-management.update');
    Route::post('inventory-management/{item}/restock', [App\Http\Controllers\InventoryController::class, 'restock'])->name('inventory-management.restock');
    Route::delete('inventory-management/{item}', [App\Http\Controllers\InventoryController::class, 'destroy'])->name('inventory-management.destroy');
    Route::get('inventory-management/export', [App\Http\Controllers\InventoryController::class, 'export'])->name('inventory-management.export');

    Route::get('pet-records', [App\Http\Controllers\PetController::class, 'index'])->name('pet-records');
    Route::get('pet-records/export', [App\Http\Controllers\PetController::class, 'export'])->name('pet-records.export');
    Route::post('pet-records', [App\Http\Controllers\PetController::class, 'store'])->name('pet-records.store');
    Route::get('pet-records/{pet}/manage', [App\Http\Controllers\PetController::class, 'manage'])->name('pet-records.manage');
    Route::delete('pet-records/{pet}', [App\Http\Controllers\PetController::class, 'destroy'])->name('pet-records.destroy');
    Route::post('pet-records/{pet}/consultations', [App\Http\Controllers\ConsultationController::class, 'store'])->name('consultations.store');
    Route::post('pet-records/{pet}/vaccinations', [App\Http\Controllers\VaccinationController::class, 'store'])->name('vaccinations.store');
    Route::put('pet-records/{pet}/vaccinations/{vaccination}', [App\Http\Controllers\VaccinationController::class, 'update'])->name('vaccinations.update');
    Route::post('pet-records/{pet}/medications', [App\Http\Controllers\MedicationController::class, 'store'])->name('medications.store');

    Route::get('chatbot-assistant', function () {
        return Inertia::render('chatbot-assistant');
    })->name('chatbot-assistant');

    // AI Assistant API routes
    Route::post('ai/chat', [App\Http\Controllers\AiAssistantController::class, 'chat'])->name('ai.chat');
    Route::post('ai/test-connection', [App\Http\Controllers\AiAssistantController::class, 'testConnection'])->name('ai.test-connection');
    Route::get('ai/models', [App\Http\Controllers\AiAssistantController::class, 'getModels'])->name('ai.models');
    Route::get('ai/context', [App\Http\Controllers\AiAssistantController::class, 'getContext'])->name('ai.context');
    Route::get('ai/search/pets', [App\Http\Controllers\AiAssistantController::class, 'searchPets'])->name('ai.search.pets');
    Route::get('ai/search/inventory', [App\Http\Controllers\AiAssistantController::class, 'searchInventory'])->name('ai.search.inventory');
    Route::get('ai/pets/{petId}', [App\Http\Controllers\AiAssistantController::class, 'getPetDetails'])->name('ai.pet.details');

    // AI Conversation routes
    Route::get('ai/conversations', [App\Http\Controllers\AiAssistantController::class, 'getConversations'])->name('ai.conversations');
    Route::post('ai/conversations', [App\Http\Controllers\AiAssistantController::class, 'createConversation'])->name('ai.conversations.create');
    Route::get('ai/conversations/{id}', [App\Http\Controllers\AiAssistantController::class, 'getConversation'])->name('ai.conversations.show');
    Route::put('ai/conversations/{id}', [App\Http\Controllers\AiAssistantController::class, 'updateConversation'])->name('ai.conversations.update');
    Route::delete('ai/conversations/{id}', [App\Http\Controllers\AiAssistantController::class, 'deleteConversation'])->name('ai.conversations.delete');
    Route::post('ai/conversations/{conversationId}/messages', [App\Http\Controllers\AiAssistantController::class, 'sendMessage'])->name('ai.conversations.message');

    // Notifications API
    Route::get('notifications/inventory', [App\Http\Controllers\NotificationController::class, 'index'])->name('notifications.inventory');

    Route::get('reports', [App\Http\Controllers\ReportsController::class, 'index'])->name('reports');
    Route::get('reports/export/financial', [App\Http\Controllers\ReportsController::class, 'exportFinancial'])->name('reports.export.financial');
    Route::get('reports/export/service', [App\Http\Controllers\ReportsController::class, 'exportService'])->name('reports.export.service');

    Route::get('billing', [App\Http\Controllers\BillingController::class, 'index'])->name('billing');
    Route::post('billing/process/{payment}', [App\Http\Controllers\BillingController::class, 'processPayment'])->name('billing.process');

    // Admin-only routes
    Route::middleware(['role:admin'])->group(function () {
        Route::get('user-management', [App\Http\Controllers\UserController::class, 'index'])->name('user-management');
        Route::get('user-management/export', [App\Http\Controllers\UserController::class, 'export'])->name('user-management.export');
        Route::post('user-management', [App\Http\Controllers\UserController::class, 'store'])->name('user-management.store');
        Route::put('user-management/{user}', [App\Http\Controllers\UserController::class, 'update'])->name('user-management.update');
        Route::patch('user-management/{user}/toggle-status', [App\Http\Controllers\UserController::class, 'toggleStatus'])->name('user-management.toggle-status');
        Route::delete('user-management/{user}', [App\Http\Controllers\UserController::class, 'destroy'])->name('user-management.destroy');

        Route::get('system-settings', function () {
            return Inertia::render('system-settings');
        })->name('system-settings');

        // AI Configuration routes (admin only)
        Route::get('ai/config', [App\Http\Controllers\AiConfigurationController::class, 'show'])->name('ai.config.show');
        Route::put('ai/config', [App\Http\Controllers\AiConfigurationController::class, 'update'])->name('ai.config.update');
        Route::post('ai/config/reset', [App\Http\Controllers\AiConfigurationController::class, 'reset'])->name('ai.config.reset');
        Route::get('ai/config/models', [App\Http\Controllers\AiConfigurationController::class, 'getModels'])->name('ai.config.models');
    });
});

require __DIR__.'/settings.php';
