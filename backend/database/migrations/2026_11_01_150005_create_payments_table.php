<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Payments are made OUTSIDE the system (M-Pesa, bank transfer, cash).
        // This table only RECORDS and CONFIRMS them. No payment gateway involved.
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recorded_by')->constrained('users'); // who entered it
            $table->foreignId('confirmed_by')->nullable()->constrained('users'); // who verified it
            $table->decimal('amount', 12, 2);
            $table->enum('method', ['mpesa', 'bank', 'cash']);
            $table->string('reference')->nullable(); // M-Pesa code, bank slip no, receipt no
            $table->enum('type', ['deposit', 'balance', 'full'])->default('deposit');
            $table->enum('status', ['pending', 'confirmed', 'rejected'])->default('pending');
            $table->date('paid_at');
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
