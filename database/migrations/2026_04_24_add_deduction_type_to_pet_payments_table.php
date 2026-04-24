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
        Schema::table('pet_payments', function (Blueprint $table) {
            $table->string('deduction_type')->nullable()->after('deduction_amount'); // 'pesos' or 'percentage'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pet_payments', function (Blueprint $table) {
            $table->dropColumn('deduction_type');
        });
    }
};
