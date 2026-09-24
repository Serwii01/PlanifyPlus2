<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Chat de cada actividad entre las personas inscritas.
        Schema::create('mensajes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actividad_id')->constrained('actividades')->cascadeOnDelete();
            $table->foreignId('usuario_id')->constrained('usuarios')->cascadeOnDelete();
            $table->string('texto', 1000);
            $table->timestamps();
            $table->index(['actividad_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mensajes');
    }
};
