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
        if (Schema::hasColumn('pets', 'species_id')) {
            if (Schema::hasColumn('pets', 'pet_species_id')) {
                DB::table('pets')
                    ->whereNull('species_id')
                    ->update(['species_id' => DB::raw('pet_species_id')]);
            }

            Schema::table('pets', function (Blueprint $table) {
                $table->dropForeign(['species_id']);
                $table->dropColumn('species_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasColumn('pets', 'species_id')) {
            Schema::table('pets', function (Blueprint $table) {
                $table->foreignId('species_id')
                    ->nullable()
                    ->constrained('pet_species', 'pet_species_id')
                    ->after('owner_id');
            });
        }
    }
};
