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
        Schema::create('vaccinations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pet_id')->constrained()->onDelete('cascade');
            $table->string('vaccine_name');
            $table->string('vaccine_type')->nullable(); // Core, Non-core, etc.
            $table->date('vaccination_date');
            $table->date('next_due_date');
            $table->string('batch_number')->nullable();
            $table->string('manufacturer')->nullable();
            $table->string('administered_by')->nullable();
            $table->string('clinic_location')->nullable();
            $table->decimal('cost', 8, 2)->nullable();
            $table->text('notes')->nullable();
            $table->text('adverse_reactions')->nullable();
            $table->enum('status', ['pending', 'administered', 'overdue', 'cancelled'])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vaccinations');
    }
};
