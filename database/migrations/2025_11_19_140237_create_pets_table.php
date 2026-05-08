<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pets', function (Blueprint $table) {
            $table->id('pet_id');
            $table->string('name');
            $table->foreignId('owner_id')->constrained('owners', 'owner_id')->onDelete('cascade');
            $table->foreignId('species_id')->constrained('pet_species', 'pet_species_id');
            $table->string('breed')->nullable();
            $table->integer('age')->nullable();
            $table->decimal('weight', 5, 2)->nullable();
            $table->enum('gender', ['male', 'female']);
            $table->string('color')->nullable();
            $table->string('microchip_id')->nullable()->unique();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamp('last_visit')->nullable();
            $table->timestamps();

            $table->index(['name', 'owner_id']);
            $table->index(['species_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pets');
    }
};
