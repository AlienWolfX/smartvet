<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('clinic_logo')->nullable()->after('clinic_name');
            $table->string('theme_name')->default('forest')->after('clinic_logo');
            $table->string('theme_color')->default('#14532d')->after('theme_name');
            $table->boolean('is_setup_complete')->default(false)->after('theme_color');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['clinic_logo', 'theme_name', 'theme_color', 'is_setup_complete']);
        });
    }
};
