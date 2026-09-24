<?php

namespace Tests\Feature;

use App\Models\Actividad;
use App\Models\Usuario;
use Tests\TestCase;

class ChatTest extends TestCase
{
    public function test_solo_las_personas_inscritas_leen_y_escriben_en_el_chat(): void
    {
        $actividad = Actividad::factory()->create();
        $inscrita = Usuario::factory()->create(['nombre' => 'Inscrita']);
        $ajeno = Usuario::factory()->create();
        $actividad->inscritos()->attach($inscrita->id);

        $this->actingAs($ajeno)->getJson("/api/actividades/{$actividad->id}/mensajes")->assertForbidden();
        $this->actingAs($ajeno)->postJson("/api/actividades/{$actividad->id}/mensajes", ['texto' => 'Hola'])->assertForbidden();

        $this->actingAs($inscrita)
            ->postJson("/api/actividades/{$actividad->id}/mensajes", ['texto' => '¿Quedamos antes?'])
            ->assertCreated()
            ->assertJsonPath('texto', '¿Quedamos antes?')
            ->assertJsonPath('usuario.nombre', 'Inscrita')
            ->assertJsonPath('propio', true);

        $this->actingAs($inscrita)
            ->getJson("/api/actividades/{$actividad->id}/mensajes")
            ->assertOk()
            ->assertJsonCount(1);
    }

    public function test_el_sondeo_con_desde_solo_devuelve_los_mensajes_nuevos(): void
    {
        $actividad = Actividad::factory()->create();
        $usuario = Usuario::factory()->create();
        $actividad->inscritos()->attach($usuario->id);

        $primero = $this->actingAs($usuario)->postJson("/api/actividades/{$actividad->id}/mensajes", ['texto' => 'Uno'])->json('id');
        $this->actingAs($usuario)->postJson("/api/actividades/{$actividad->id}/mensajes", ['texto' => 'Dos']);

        $this->actingAs($usuario)
            ->getJson("/api/actividades/{$actividad->id}/mensajes?desde={$primero}")
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.texto', 'Dos');
    }

    public function test_el_mensaje_no_puede_estar_vacio(): void
    {
        $actividad = Actividad::factory()->create();
        $usuario = Usuario::factory()->create();
        $actividad->inscritos()->attach($usuario->id);

        $this->actingAs($usuario)
            ->postJson("/api/actividades/{$actividad->id}/mensajes", ['texto' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['texto']);
    }

    public function test_el_admin_lee_y_borra_mensajes_pero_no_escribe_y_el_autor_borra_los_suyos(): void
    {
        $actividad = Actividad::factory()->create();
        $autora = Usuario::factory()->create();
        $otra = Usuario::factory()->create();
        $admin = Usuario::factory()->admin()->create();
        $actividad->inscritos()->attach([$autora->id, $otra->id]);

        $id = $this->actingAs($autora)->postJson("/api/actividades/{$actividad->id}/mensajes", ['texto' => 'Mío'])->json('id');
        $otro = $this->actingAs($otra)->postJson("/api/actividades/{$actividad->id}/mensajes", ['texto' => 'Suyo'])->json('id');

        $this->actingAs($admin)->getJson("/api/actividades/{$actividad->id}/mensajes")->assertOk()->assertJsonCount(2);
        $this->actingAs($admin)->postJson("/api/actividades/{$actividad->id}/mensajes", ['texto' => 'Hola'])->assertForbidden();

        $this->actingAs($autora)->deleteJson("/api/mensajes/{$otro}")->assertForbidden();
        $this->actingAs($autora)->deleteJson("/api/mensajes/{$id}")->assertNoContent();
        $this->actingAs($admin)->deleteJson("/api/mensajes/{$otro}")->assertNoContent();

        $this->assertDatabaseCount('mensajes', 0);
    }
}
