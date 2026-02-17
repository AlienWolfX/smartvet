<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'staff', 'clinic') NOT NULL DEFAULT 'clinic'");
        // Convert existing staff to clinic
        DB::table('users')->where('role', 'staff')->update(['role' => 'clinic']);
    }

    public function down(): void
    {
        DB::table('users')->where('role', 'clinic')->update(['role' => 'staff']);
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff'");
    }
};
