<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration populates the created_by field for consultations
     * based on the pet's owner (original clinic). This ensures that:
     * 1. Consultations created before the created_by column was added
     *    are properly attributed to the original clinic
     * 2. The payment status visibility logic works correctly for
     *    consultations from other clinics
     */
    public function up(): void
    {
        if (Schema::hasColumn('consultations', 'created_by')) {
            // Update consultations where created_by is still NULL
            // by using the pet's owner's user_id (the clinic that created the pet)
            DB::statement('
                UPDATE consultations c
                INNER JOIN pets p ON c.pet_id = p.id
                INNER JOIN owners o ON p.owner_id = o.id
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
        // This migration only populates existing data, so no reverse action needed
    }
};
