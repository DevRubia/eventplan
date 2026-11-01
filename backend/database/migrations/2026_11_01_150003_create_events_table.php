<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->string('type'); // Wedding, Birthday, Corporate, Conference, Graduation, Other
            $table->date('event_date');
            $table->string('venue')->nullable();
            $table->string('location')->nullable();
            $table->unsignedInteger('guest_count')->default(0);
            $table->decimal('budget', 12, 2)->default(0);
            $table->enum('status', ['planning', 'confirmed', 'completed', 'cancelled'])->default('planning');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
