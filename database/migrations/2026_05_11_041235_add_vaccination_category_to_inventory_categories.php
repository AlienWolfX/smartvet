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
        DB::table('inventory_categories')->updateOrInsert(
            ['slug' => 'vaccines'],
            [
                'name' => 'Vaccines',
                'icon' => '💉',
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('inventory_categories')->where('slug', 'vaccines')->delete();
    }
};
