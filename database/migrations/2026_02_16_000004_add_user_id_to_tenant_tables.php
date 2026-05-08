<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add user_id to root tenant tables for multi-clinic data isolation.
     * - owners: each pet owner belongs to the clinic that registered them
     * - inventory_items: each inventory item belongs to a specific clinic
     */
    public function up(): void
    {
        Schema::table('owners', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('owner_id')->constrained('users', 'user_id')->nullOnDelete();
            $table->index('user_id');
        });

        Schema::table('inventory_items', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('inventory_item_id')->constrained('users', 'user_id')->nullOnDelete();
            $table->index('user_id');
        });

        // Backfill: assign existing records to the first admin user
        $adminId = DB::table('users')->where('role', 'admin')->value('user_id');
        if ($adminId) {
            DB::table('owners')->whereNull('user_id')->update(['user_id' => $adminId]);
            DB::table('inventory_items')->whereNull('user_id')->update(['user_id' => $adminId]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('owners', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });

        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};
