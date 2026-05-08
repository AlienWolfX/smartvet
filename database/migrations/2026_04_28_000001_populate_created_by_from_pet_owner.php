<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('consultations', 'created_by')) {
            DB::statement('
                UPDATE consultations c
                INNER JOIN pets p ON c.pet_id = p.pet_id
                INNER JOIN owners o ON p.owner_id = o.owner_id
                SET c.created_by = o.user_id
                WHERE c.created_by IS NULL
            ');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {

    }
};
