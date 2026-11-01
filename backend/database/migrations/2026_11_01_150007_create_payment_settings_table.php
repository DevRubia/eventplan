<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Single-row configuration for how offline payments are recorded.
        Schema::create('payment_settings', function (Blueprint $table) {
            $table->id();
            $table->string('currency', 10)->default('KES');
            $table->unsignedTinyInteger('deposit_percentage')->default(30); // default deposit %
            $table->boolean('require_reference')->default(true); // force M-Pesa code / slip no before confirming
            $table->enum('confirmation_role', ['admin', 'vendor_or_admin'])->default('vendor_or_admin'); // who can confirm
            $table->json('allowed_methods')->nullable(); // ["mpesa","bank","cash"]
            $table->string('receipt_prefix', 20)->default('EP');
            $table->string('business_name')->nullable();
            $table->text('business_details')->nullable(); // Paybill / till / bank account shown to clients
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_settings');
    }
};
