<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Generic admin-managed lookup lists, so categories / types / units / methods
    // are configurable per market instead of being hardcoded.
    public function up(): void
    {
        Schema::create('options', function (Blueprint $table) {
            $table->id();
            $table->string('group'); // service_category, event_type, service_unit, payment_method
            $table->string('value');
            $table->string('label');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['group', 'value']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('options');
    }
};
