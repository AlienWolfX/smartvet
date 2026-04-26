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
        Schema::table('consultations', function (Blueprint $table) {
            if (! Schema::hasColumn('consultations', 'created_by')) {
                $table->foreignId('created_by')
                    ->nullable()
                    ->after('veterinarian')
                    ->constrained('users')
                    ->nullOnDelete();
            }
        });

        if (Schema::hasColumn('consultations', 'created_by')) {
            DB::table('consultations')
                ->leftJoin('pet_payments', 'pet_payments.consultation_id', '=', 'consultations.id')
                ->whereNull('consultations.created_by')
                ->update(['consultations.created_by' => DB::raw('pet_payments.recorded_by')]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            if (Schema::hasColumn('consultations', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }
        });
    }
};
