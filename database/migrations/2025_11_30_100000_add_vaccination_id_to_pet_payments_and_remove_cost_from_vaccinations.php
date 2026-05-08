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
        // Add vaccination_id to pet_payments
        Schema::table('pet_payments', function (Blueprint $table) {
            $table->foreignId('vaccination_id')->nullable()->after('consultation_id')->constrained('vaccinations', 'vaccination_id')->onDelete('cascade');
        });

        // Remove cost column from vaccinations
        Schema::table('vaccinations', function (Blueprint $table) {
            $table->dropColumn('cost');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pet_payments', function (Blueprint $table) {
            $table->dropForeign(['vaccination_id']);
            $table->dropColumn('vaccination_id');
        });

        Schema::table('vaccinations', function (Blueprint $table) {
            $table->decimal('cost', 8, 2)->nullable()->after('clinic_location');
        });
    }
};
