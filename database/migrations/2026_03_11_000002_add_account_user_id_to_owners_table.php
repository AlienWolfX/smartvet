<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('owners', function (Blueprint $table) {
            $table->foreignId('account_user_id')
                ->nullable()
                ->after('user_id')
                ->constrained('users', 'user_id')
                ->nullOnDelete();

            $table->index('account_user_id');
        });
    }

    public function down(): void
    {
        Schema::table('owners', function (Blueprint $table) {
            $table->dropForeign(['account_user_id']);
            $table->dropIndex(['account_user_id']);
            $table->dropColumn('account_user_id');
        });
    }
};
