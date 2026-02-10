<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('inventory_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('icon')->nullable();
            $table->timestamps();
        });

        DB::table('inventory_categories')->insert([
            ['name' => 'Medications', 'slug' => 'medications', 'icon' => 'Pill', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Medical Supplies', 'slug' => 'supplies', 'icon' => 'Package', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Equipment', 'slug' => 'equipment', 'icon' => 'Stethoscope', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Pet Food & Treats', 'slug' => 'food', 'icon' => 'Cookie', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Cleaning & Hygiene', 'slug' => 'cleaning', 'icon' => 'Spray', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_categories');
    }
};
