<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consultation_types', function (Blueprint $table) {
            $table->id('consultation_type_id');
            $table->foreignId('user_id')->constrained('users', 'user_id')->cascadeOnDelete();
            $table->string('slug');
            $table->string('name');
            $table->decimal('fee', 10, 2)->default(0);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultation_types');
    }
};
