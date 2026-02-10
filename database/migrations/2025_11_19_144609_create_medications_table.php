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
        Schema::create('medications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pet_id')->constrained()->onDelete('cascade');
            $table->foreignId('consultation_id')->nullable()->constrained()->onDelete('set null');
            $table->string('medication_name');
            $table->string('generic_name')->nullable();
            $table->string('dosage');
            $table->string('frequency'); // e.g., "Twice daily", "Every 8 hours"
            $table->string('route'); // e.g., "Oral", "Topical", "Injectable"
            $table->text('purpose'); // What condition it's treating
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->integer('duration_days')->nullable();
            $table->decimal('cost', 8, 2)->nullable();
            $table->string('prescribed_by')->nullable();
            $table->text('instructions')->nullable();
            $table->text('side_effects')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['active', 'completed', 'discontinued', 'on-hold'])->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medications');
    }
};
