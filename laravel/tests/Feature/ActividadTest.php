<?php

namespace Tests\Feature;

use App\Models\Actividad;
use App\Models\Usuario;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class ActividadTest extends TestCase
{
    private function datosActividad(array $cambios = []): array
    {
        return $cambios + [
            'titulo' => 'Clase de yoga',
            'descripcion' => 'Sesión relajante',
            'fecha_hora_inicio' => now()->addDays(2)->format('Y-m-d\TH:i:s'),
            'tipo' => 'DEPORTIVA',
            'ubicacion' => 'Parque de María Luisa',
            'ciudad' => 'Sevilla',
            'latitud' => 37.3687,
            'longitud' => -5.9877,
            'aforo' => 2,
        ];
    }

    public function test_el_listado_es_publico_y_marca_el_estado_del_usuario_si_envia_token(): void
    {
        $usuario = Usuario::factory()->create();
        $actividad = Actividad::factory()->predeterminada()->create();
        $actividad->inscritos()->attach($usuario->id);

        $this->getJson('/api/actividades')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.inscritos', 1)
            ->assertJsonPath('0.inscrito', false);

        $this->withToken(JWTAuth::fromUser($usuario))
            ->getJson('/api/actividades')
            ->assertJsonPath('0.inscrito', true);
    }

    public function test_crear_una_actividad_inscribe_al_creador(): void
    {
        $usuario = Usuario::factory()->create();

        $this->actingAs($usuario)
            ->postJson('/api/actividades', $this->datosActividad())
            ->assertCreated()
            ->assertJsonPath('creador_id', $usuario->id)
            ->assertJsonPath('inscritos', 1)
            ->assertJsonPath('inscrito', true);
    }

    public function test_la_actividad_debe_tener_fecha_futura_y_aforo_positivo(): void
    {
        $this->actingAs(Usuario::factory()->create())
            ->postJson('/api/actividades', $this->datosActividad([
                'fecha_hora_inicio' => now()->subHour()->format('Y-m-d\TH:i:s'),
                'aforo' => 0,
            ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['fecha_hora_inicio', 'aforo']);
    }

    public function test_el_admin_no_crea_actividades_pero_si_las_elimina(): void
    {
        $admin = Usuario::factory()->admin()->create();
        $actividad = Actividad::factory()->creadaPor(Usuario::factory()->create())->create();

        $this->actingAs($admin)->postJson('/api/actividades', $this->datosActividad())->assertForbidden();
        $this->actingAs($admin)->deleteJson("/api/actividades/{$actividad->id}")->assertNoContent();

        $this->assertModelMissing($actividad);
    }

    public function test_solo_el_creador_edita_o_elimina_su_actividad(): void
    {
        $creador = Usuario::factory()->create();
        $otro = Usuario::factory()->create();
        $actividad = Actividad::factory()->creadaPor($creador)->create();

        $this->actingAs($otro)
            ->putJson("/api/actividades/{$actividad->id}", $this->datosActividad())
            ->assertForbidden();
        $this->actingAs($otro)->deleteJson("/api/actividades/{$actividad->id}")->assertForbidden();

        $this->actingAs($creador)
            ->putJson("/api/actividades/{$actividad->id}", $this->datosActividad(['titulo' => 'Editada']))
            ->assertOk()
            ->assertJsonPath('titulo', 'Editada');
    }

    public function test_la_inscripcion_respeta_el_aforo_y_se_puede_cancelar(): void
    {
        [$ana, $luis, $eva] = Usuario::factory()->count(3)->create();
        $actividad = Actividad::factory()->create(['aforo' => 2]);

        $this->actingAs($ana)->postJson("/api/actividades/{$actividad->id}/inscripcion")
            ->assertOk()->assertJsonPath('inscritos', 1)->assertJsonPath('inscrito', true);
        $this->actingAs($luis)->postJson("/api/actividades/{$actividad->id}/inscripcion")->assertOk();
        $this->actingAs($eva)->postJson("/api/actividades/{$actividad->id}/inscripcion")->assertConflict();

        $this->actingAs($ana)->deleteJson("/api/actividades/{$actividad->id}/inscripcion")
            ->assertOk()->assertJsonPath('inscritos', 1)->assertJsonPath('inscrito', false);

        $this->actingAs($ana)->getJson('/api/inscripciones')->assertOk()->assertJsonCount(0);
        $this->actingAs($luis)->getJson('/api/inscripciones')->assertOk()->assertJsonPath('0.id', $actividad->id);
    }

    public function test_no_se_admiten_inscripciones_en_actividades_que_ya_han_comenzado(): void
    {
        $actividad = Actividad::factory()->create(['fecha_hora_inicio' => now()->subHour()]);

        $this->actingAs(Usuario::factory()->create())
            ->postJson("/api/actividades/{$actividad->id}/inscripcion")
            ->assertConflict();
    }

    public function test_cada_usuario_denuncia_una_actividad_una_sola_vez(): void
    {
        $usuario = Usuario::factory()->create();
        $actividad = Actividad::factory()->create();

        $this->actingAs($usuario)->postJson("/api/actividades/{$actividad->id}/denuncia")
            ->assertOk()->assertJsonPath('denuncias', 1)->assertJsonPath('denunciada', true);
        $this->actingAs($usuario)->postJson("/api/actividades/{$actividad->id}/denuncia")
            ->assertOk()->assertJsonPath('denuncias', 1);

        $this->actingAs(Usuario::factory()->admin()->create())
            ->postJson("/api/actividades/{$actividad->id}/denuncia")
            ->assertForbidden();
    }
}
