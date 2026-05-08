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
        Schema::create('consultation_files', function (Blueprint $table) {
            $table->id('consultation_file_id');
            $table->foreignId('consultation_id')->constrained('consultations', 'consultation_id')->onDelete('cascade');
            $table->string('file_name');
            $table->string('original_name');
            $table->string('file_path');
            $table->string('file_type'); // image, document, lab-result, x-ray
            $table->string('mime_type');
            $table->bigInteger('file_size'); // in bytes
            $table->text('description')->nullable();
            $table->string('uploaded_by')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consultation_files');
    }
};
