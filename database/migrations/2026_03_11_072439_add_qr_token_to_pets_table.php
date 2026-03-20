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
        Schema::table('pets', function (Blueprint $table) {
            $table->uuid('qr_token')->unique()->nullable()->after('microchip_id');
        });

        DB::table('pets')->whereNull('qr_token')->orderBy('id')->each(function ($pet) {
            DB::table('pets')->where('id', $pet->id)->update(['qr_token' => \Illuminate\Support\Str::uuid()]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->dropColumn('qr_token');
        });
    }
};
