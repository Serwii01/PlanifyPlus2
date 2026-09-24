<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Banco de fotos: imágenes libres importadas (Openverse) y fotos subidas por los usuarios.
        Schema::create('fotos', function (Blueprint $table) {
            $table->id();
            $table->string('ruta');                              // ruta dentro del disco `fotos`
            $table->string('titulo', 150)->nullable();
            $table->string('etiquetas', 255);                    // "padel, deporte, raqueta" (sin acentos, en minúsculas)
            $table->string('autor', 150)->nullable();
            $table->string('licencia', 30);                      // cc0, by, by-sa, propia…
            $table->string('fuente_url')->nullable()->unique();  // origen (para atribución y evitar duplicados)
            $table->boolean('publica')->default(true);           // false: avatar u otra foto que no entra en el banco
            $table->foreignId('subida_por_id')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->timestamps();
        });

        Schema::table('actividades', function (Blueprint $table) {
            $table->foreignId('foto_id')->nullable()->after('aforo')->constrained('fotos')->nullOnDelete();
        });

        Schema::table('usuarios', function (Blueprint $table) {
            $table->foreignId('foto_id')->nullable()->after('longitud')->constrained('fotos')->nullOnDelete();
            $table->string('bio', 300)->nullable()->after('foto_id');
        });
    }

    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->dropConstrainedForeignId('foto_id');
            $table->dropColumn('bio');
        });
        Schema::table('actividades', function (Blueprint $table) {
            $table->dropConstrainedForeignId('foto_id');
        });
        Schema::dropIfExists('fotos');
    }
};
