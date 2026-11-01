<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Make the payment method free-form (string) so admins can add methods
    // beyond the original M-Pesa / bank / cash for other markets.
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('method')->change();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->enum('method', ['mpesa', 'bank', 'cash'])->change();
        });
    }
};
