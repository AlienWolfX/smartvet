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
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'history_visibility')) {
                $table->dropColumn('history_visibility');
            }
        });

        Schema::table('pets', function (Blueprint $table) {
            if (Schema::hasColumn('pets', 'history_visibility')) {
                $table->dropColumn('history_visibility');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'history_visibility')) {
                $table->enum('history_visibility', ['public', 'private'])->default('public')->after('status');
            }
        });

        Schema::table('pets', function (Blueprint $table) {
            if (!Schema::hasColumn('pets', 'history_visibility')) {
                $table->enum('history_visibility', ['public', 'private'])->default('public')->after('status');
            }
        });
    }
};
