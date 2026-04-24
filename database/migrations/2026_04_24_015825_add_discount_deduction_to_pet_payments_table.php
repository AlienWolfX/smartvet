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
            $table->decimal('discount_amount', 10, 2)->default(0)->after('total_amount');
            $table->string('discount_type')->nullable()->after('discount_amount'); // 'senior', 'custom', null
            $table->decimal('deduction_amount', 10, 2)->default(0)->after('discount_type');
            $table->string('deduction_reason')->nullable()->after('deduction_amount');
            $table->decimal('final_amount', 10, 2)->nullable()->after('deduction_reason'); // Amount actually paid
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pet_payments', function (Blueprint $table) {
            $table->dropColumn(['discount_amount', 'discount_type', 'deduction_amount', 'deduction_reason', 'final_amount']);
        });
    }
};
