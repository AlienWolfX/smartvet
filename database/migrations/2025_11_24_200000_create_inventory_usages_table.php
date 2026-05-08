<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('inventory_usages', function (Blueprint $table) {
            $table->id('inventory_usage_id');
            $table->foreignId('inventory_item_id')->constrained('inventory_items', 'inventory_item_id')->cascadeOnDelete();
            $table->morphs('usable');
            $table->unsignedInteger('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_usages');
    }
};
