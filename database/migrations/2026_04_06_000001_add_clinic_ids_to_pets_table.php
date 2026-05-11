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
        if (!Schema::hasColumn('pets', 'clinic_ids')) {
            Schema::table('pets', function (Blueprint $table) {
                $table->json('clinic_ids')->nullable();
            });

            DB::statement('
                UPDATE pets
                INNER JOIN owners ON pets.owner_id = owners.owner_id
                SET pets.clinic_ids = JSON_ARRAY(owners.user_id)
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

