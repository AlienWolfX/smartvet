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
        Schema::create('clinic_visibility_permissions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('granting_clinic_id');
            $table->unsignedBigInteger('receiving_clinic_id');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();

            $table->unique(['granting_clinic_id', 'receiving_clinic_id']);
            $table->foreign('granting_clinic_id')->references('user_id')->on('users')->onDelete('cascade');
            $table->foreign('receiving_clinic_id')->references('user_id')->on('users')->onDelete('cascade');

            $table->index('granting_clinic_id');
            $table->index('receiving_clinic_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clinic_visibility_permissions');
    }
};
