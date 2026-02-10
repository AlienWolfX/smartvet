<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('pet_payments', function (Blueprint $table) {
            $table->foreignId('consultation_id')->nullable()->after('pet_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('pending')->after('total_amount');
        });
    }

    public function down(): void
    {
        Schema::table('pet_payments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('consultation_id');
            $table->dropColumn('status');
        });
    }
};
