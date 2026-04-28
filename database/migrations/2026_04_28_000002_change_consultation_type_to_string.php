<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            // Change the enum column to string to support dynamic consultation types
            $table->string('consultation_type')->change();
        });
    }

    public function down(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            // Revert to enum if needed
            $table->enum('consultation_type', ['routine-checkup', 'emergency', 'vaccination', 'surgery', 'follow-up'])->change();
        });
    }
};
