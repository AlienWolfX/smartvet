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
        Schema::table('vaccinations', function (Blueprint $table) {
            if (!Schema::hasColumn('vaccinations', 'consultation_id')) {
                $table->foreignId('consultation_id')
                    ->nullable()
                    ->after('pet_id')
                    ->constrained('consultations', 'consultation_id')
                    ->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vaccinations', function (Blueprint $table) {
            if (Schema::hasColumn('vaccinations', 'consultation_id')) {
                $table->dropForeign(['consultation_id']);
                $table->dropColumn('consultation_id');
            }
        });
    }
};
