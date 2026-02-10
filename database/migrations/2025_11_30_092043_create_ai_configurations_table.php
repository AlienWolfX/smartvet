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
        Schema::create('ai_configurations', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique()->default('default');
            $table->string('provider')->default('local'); // openai, anthropic, google, local
            $table->string('model')->default('qwen2:7b');
            $table->string('api_key')->nullable();
            $table->string('api_endpoint')->nullable();
            $table->decimal('temperature', 3, 2)->default(0.7);
            $table->integer('max_tokens')->default(1000);
            $table->text('system_prompt');
            $table->text('category_rules')->nullable();
            $table->boolean('enabled')->default(true);
            $table->json('features')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_configurations');
    }
};
