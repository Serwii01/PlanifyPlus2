<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Red social: `seguidor` sigue a `seguido`. Una sola fila por pareja.
        Schema::create('seguimientos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seguidor_id')->constrained('usuarios')->cascadeOnDelete();
            $table->foreignId('seguido_id')->constrained('usuarios')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['seguidor_id', 'seguido_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seguimientos');
    }
};
