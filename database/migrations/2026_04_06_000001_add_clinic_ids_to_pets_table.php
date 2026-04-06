<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add clinic_ids JSON column if it doesn't exist
        if (!Schema::hasColumn('pets', 'clinic_ids')) {
            Schema::table('pets', function (Blueprint $table) {
                $table->json('clinic_ids')->nullable()->after('microchip_id');
            });

            // Initialize existing pets with their owner's clinic ID
            DB::statement('
                UPDATE pets
                SET clinic_ids = JSON_ARRAY(owners.user_id)
                FROM owners
                WHERE pets.owner_id = owners.id
            ');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            if (Schema::hasColumn('pets', 'clinic_ids')) {
                $table->dropColumn('clinic_ids');
            }
        });
    }
};

