<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dismissed_notifications', function (Blueprint $table) {
            $table->id('dismissed_notification_id');
            $table->foreignId('user_id')->constrained('users', 'user_id')->onDelete('cascade');
            $table->foreignId('inventory_item_id')->constrained('inventory_items', 'inventory_item_id')->onDelete('cascade');
            $table->string('notification_type'); // expired, expiring_soon, out_of_stock, low_stock
            $table->timestamp('dismissed_at')->useCurrent();

            $table->unique(['user_id', 'inventory_item_id', 'notification_type'], 'dismissed_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dismissed_notifications');
    }
};
