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
        if (Schema::hasColumn('pets', 'microchip_id')) {
            Schema::table('pets', function (Blueprint $table) {
                $table->dropColumn('microchip_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('pets', 'microchip_id')) {
            Schema::table('pets', function (Blueprint $table) {
                $table->string('microchip_id')->nullable()->unique();
            });
        }
    }
};
