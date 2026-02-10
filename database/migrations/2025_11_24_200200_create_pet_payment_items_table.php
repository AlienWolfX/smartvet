<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pet_payment_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pet_payment_id')->constrained()->cascadeOnDelete();
            $table->string('service_type');
            $table->unsignedBigInteger('service_id')->nullable();
            $table->string('description');
            $table->decimal('amount', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pet_payment_items');
    }
};
