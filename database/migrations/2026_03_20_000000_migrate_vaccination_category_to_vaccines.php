<?php

use App\Models\InventoryCategory;
use App\Models\InventoryItem;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $vaccinationCategory = InventoryCategory::where('slug', 'vaccination')->first();

        if (!$vaccinationCategory) {
            return;
        }

        $vaccineCategory = InventoryCategory::firstOrCreate(
            ['slug' => 'vaccines'],
            ['name' => 'Vaccines', 'icon' => '💉']
        );

        InventoryItem::where('inventory_category_id', $vaccinationCategory->id)
            ->update(['inventory_category_id' => $vaccineCategory->id]);

        $vaccinationCategory->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $vaccineCategory = InventoryCategory::where('slug', 'vaccines')->first();

        if (!$vaccineCategory) {
            return;
        }

        $vaccinationCategory = InventoryCategory::firstOrCreate(
            ['slug' => 'vaccination'],
            ['name' => 'Vaccination', 'icon' => 'Syringe']
        );

        InventoryItem::where('inventory_category_id', $vaccineCategory->id)
            ->update(['inventory_category_id' => $vaccinationCategory->id]);

    }
};
