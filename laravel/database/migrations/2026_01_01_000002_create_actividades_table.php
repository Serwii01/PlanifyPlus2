<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('actividades', function (Blueprint $table) {
            $table->id();
            $table->string('titulo', 150);
            $table->text('descripcion');
            $table->dateTime('fecha_hora_inicio');
            $table->enum('tipo', ['CULTURAL', 'DEPORTIVA', 'TALLER']);
            $table->string('ubicacion');
            $table->string('ciudad', 100);
            $table->decimal('latitud', 9, 6)->nullable();
            $table->decimal('longitud', 9, 6)->nullable();
            $table->unsignedInteger('aforo');
            $table->boolean('predeterminada')->default(false);
            $table->foreignId('creado_por_id')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('actividades');
    }
};
