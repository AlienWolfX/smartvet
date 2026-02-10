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
        // Add payment_status to vaccinations
        Schema::table('vaccinations', function (Blueprint $table) {
            $table->enum('payment_status', ['pending', 'paid'])->default('pending')->after('status');
        });

        // Make payment_method nullable in pet_payments
        Schema::table('pet_payments', function (Blueprint $table) {
            $table->string('payment_method')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vaccinations', function (Blueprint $table) {
            $table->dropColumn('payment_status');
        });

        Schema::table('pet_payments', function (Blueprint $table) {
            $table->string('payment_method')->nullable(false)->change();
        });
    }
};
