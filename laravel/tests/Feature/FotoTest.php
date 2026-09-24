<?php

namespace Tests\Feature;

use App\Models\Actividad;
use App\Models\Foto;
use App\Models\Usuario;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FotoTest extends TestCase
{
    public function test_el_banco_se_busca_por_etiquetas_sin_acentos_y_oculta_las_privadas(): void
    {
        Foto::factory()->create(['etiquetas' => 'padel, raqueta']);
        Foto::factory()->create(['etiquetas' => 'yoga', 'titulo' => 'Clase al atardecer']);
        Foto::factory()->privada()->create(['etiquetas' => 'padel']);

        $this->actingAs(Usuario::factory()->create())
            ->getJson('/api/fotos?q=Pádel')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.etiquetas', ['padel', 'raqueta']);

        $this->getJson('/api/fotos?q=atardecer')->assertOk()->assertJsonCount(1);
        $this->getJson('/api/fotos')->assertOk()->assertJsonCount(2);
    }

    public function test_una_foto_subida_publica_entra_en_el_banco_redimensionada(): void
    {
        Storage::fake('fotos');
        $usuario = Usuario::factory()->create();

        $respuesta = $this->actingAs($usuario)->post('/api/fotos', [
            'archivo' => UploadedFile::fake()->image('pista.png', 2400, 1200),
            'etiquetas' => 'Pádel, Pista Cubierta',
            'publica' => 1,
        ], ['Accept' => 'application/json']);

        $respuesta->assertCreated()
            ->assertJsonPath('etiquetas', ['padel', 'pista cubierta'])
            ->assertJsonPath('licencia', 'propia')
            ->assertJsonPath('autor', $usuario->nombre);

        $foto = Foto::first();
        Storage::disk('fotos')->assertExists($foto->ruta);
        [$ancho] = getimagesizefromstring(Storage::disk('fotos')->get($foto->ruta));
        $this->assertSame(config('fotos.ancho_maximo'), $ancho);
        $this->assertSame($usuario->id, $foto->subida_por_id);
    }

    public function test_una_foto_privada_no_necesita_etiquetas_y_sirve_de_avatar(): void
    {
        Storage::fake('fotos');
        $usuario = Usuario::factory()->create();

        $id = $this->actingAs($usuario)->post('/api/fotos', [
            'archivo' => UploadedFile::fake()->image('yo.jpg', 400, 400),
            'publica' => 0,
        ], ['Accept' => 'application/json'])->assertCreated()->json('id');

        $this->actingAs($usuario)->putJson('/api/perfil', [
            'nombre' => $usuario->nombre,
            'email' => $usuario->email,
            'ciudad' => 'Sevilla',
            'foto_id' => $id,
            'bio' => 'Me apunto a todo lo que tenga raqueta.',
        ])->assertOk()->assertJsonPath('foto_id', $id)->assertJsonPath('bio', 'Me apunto a todo lo que tenga raqueta.');

        $this->assertNotNull($usuario->fresh()->avatar_url);
        $this->getJson('/api/fotos?q=yo')->assertOk()->assertJsonCount(0);
    }

    public function test_subir_una_foto_publica_sin_etiquetas_o_sin_imagen_falla(): void
    {
        Storage::fake('fotos');
        $usuario = Usuario::factory()->create();

        $this->actingAs($usuario)->post('/api/fotos', [
            'archivo' => UploadedFile::fake()->image('x.jpg'),
        ], ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('etiquetas');

        $this->actingAs($usuario)->post('/api/fotos', [
            'archivo' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
            'etiquetas' => 'padel',
        ], ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('archivo');
    }

    public function test_la_actividad_lleva_portada_y_lista_a_sus_asistentes(): void
    {
        $foto = Foto::factory()->create();
        $creador = Usuario::factory()->create(['nombre' => 'Ana']);
        $otro = Usuario::factory()->create(['nombre' => 'Luis']);

        $id = $this->actingAs($creador)->postJson('/api/actividades', [
            'titulo' => 'Pádel de tarde',
            'descripcion' => 'Partido amistoso',
            'fecha_hora_inicio' => now()->addDays(2)->format('Y-m-d\TH:i:s'),
            'tipo' => 'DEPORTIVA',
            'ubicacion' => 'Club de pádel',
            'ciudad' => 'Sevilla',
            'aforo' => 4,
            'foto_id' => $foto->id,
        ])->assertCreated()->assertJsonPath('foto.id', $foto->id)->json('id');

        $this->actingAs($otro)->postJson("/api/actividades/{$id}/inscripcion")->assertOk();

        $this->getJson("/api/actividades/{$id}")
            ->assertOk()
            ->assertJsonPath('inscritos', 2)
            ->assertJsonCount(2, 'asistentes')
            ->assertJsonPath('asistentes.0.nombre', 'Ana')
            ->assertJsonPath('asistentes.1.nombre', 'Luis');
    }

    public function test_el_perfil_publico_muestra_planes_pero_no_datos_privados(): void
    {
        $usuario = Usuario::factory()->create(['bio' => 'Hola', 'direccion' => 'Calle Betis 1', 'latitud' => 1, 'longitud' => 1]);
        $actividad = Actividad::factory()->create(['creado_por_id' => $usuario->id, 'fecha_hora_inicio' => now()->addDay()]);
        $actividad->inscritos()->attach($usuario->id);
        $pasada = Actividad::factory()->create(['fecha_hora_inicio' => now()->subDay()]);
        $pasada->inscritos()->attach($usuario->id);

        $this->getJson("/api/usuarios/{$usuario->id}")
            ->assertOk()
            ->assertJsonPath('nombre', $usuario->nombre)
            ->assertJsonPath('bio', 'Hola')
            ->assertJsonPath('organizadas', 1)
            ->assertJsonPath('realizadas', 1)
            ->assertJsonCount(1, 'proximas')
            ->assertJsonMissingPath('email')
            ->assertJsonMissingPath('direccion');

        $this->getJson('/api/usuarios/'.Usuario::factory()->admin()->create()->id)->assertNotFound();
    }
}
