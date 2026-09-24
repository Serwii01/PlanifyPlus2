<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            // Ubicación exacta elegida por el usuario (buscador de OpenStreetMap).
            // Si es null, latitud y longitud son las del centro de su ciudad.
            $table->string('direccion')->nullable()->after('ciudad');
        });
    }

    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->dropColumn('direccion');
        });
    }
};
