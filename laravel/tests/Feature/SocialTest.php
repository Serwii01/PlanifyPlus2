<?php

namespace Tests\Feature;

use App\Models\Actividad;
use App\Models\Usuario;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class SocialTest extends TestCase
{
    public function test_seguir_y_dejar_de_seguir_actualiza_contadores_y_flags(): void
    {
        $ana = Usuario::factory()->create(['nombre' => 'Ana']);
        $luis = Usuario::factory()->create(['nombre' => 'Luis']);

        $this->actingAs($ana)
            ->postJson("/api/usuarios/{$luis->id}/seguir")
            ->assertOk()
            ->assertJsonPath('lo_sigo', true)
            ->assertJsonPath('seguidores', 1);

        // Repetir no duplica.
        $this->actingAs($ana)->postJson("/api/usuarios/{$luis->id}/seguir")->assertOk()->assertJsonPath('seguidores', 1);

        $this->getJson("/api/usuarios/{$luis->id}/seguidores")->assertOk()->assertJsonCount(1)->assertJsonPath('0.nombre', 'Ana');
        $this->getJson("/api/usuarios/{$ana->id}/seguidos")->assertOk()->assertJsonCount(1)->assertJsonPath('0.nombre', 'Luis');

        $this->withToken(JWTAuth::fromUser($luis))
            ->getJson("/api/usuarios/{$ana->id}")
            ->assertOk()
            ->assertJsonPath('seguidos', 1)
            ->assertJsonPath('me_sigue', true)
            ->assertJsonPath('lo_sigo', false);

        $this->withToken(JWTAuth::fromUser($ana))
            ->deleteJson("/api/usuarios/{$luis->id}/seguir")
            ->assertOk()
            ->assertJsonPath('lo_sigo', false)
            ->assertJsonPath('seguidores', 0);
    }

    public function test_nadie_se_sigue_a_si_mismo_ni_participa_el_admin(): void
    {
        $usuario = Usuario::factory()->create();
        $admin = Usuario::factory()->admin()->create();

        $this->actingAs($usuario)->postJson("/api/usuarios/{$usuario->id}/seguir")->assertUnprocessable();
        $this->actingAs($usuario)->postJson("/api/usuarios/{$admin->id}/seguir")->assertForbidden();
        $this->actingAs($admin)->postJson("/api/usuarios/{$usuario->id}/seguir")->assertForbidden();
        $this->getJson("/api/usuarios/{$admin->id}/seguidores")->assertNotFound();
    }

    public function test_las_sugerencias_priorizan_a_quien_comparte_planes_y_excluyen_a_seguidos(): void
    {
        $yo = Usuario::factory()->create(['ciudad' => 'Sevilla']);
        $companera = Usuario::factory()->create(['nombre' => 'Compañera', 'ciudad' => 'Madrid']);
        $vecino = Usuario::factory()->create(['nombre' => 'Vecino', 'ciudad' => 'Sevilla']);
        $seguido = Usuario::factory()->create(['nombre' => 'Seguido', 'ciudad' => 'Sevilla']);
        Usuario::factory()->admin()->create();

        $plan = Actividad::factory()->create();
        $plan->inscritos()->attach([$yo->id, $companera->id]);
        $yo->seguidos()->attach($seguido->id);

        $this->actingAs($yo)
            ->getJson('/api/social/sugerencias')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.nombre', 'Compañera')
            ->assertJsonPath('0.planes_en_comun', 1)
            ->assertJsonPath('1.nombre', 'Vecino');
    }

    public function test_los_planes_sociales_son_los_proximos_de_la_gente_a_la_que_sigo(): void
    {
        $yo = Usuario::factory()->create();
        $amiga = Usuario::factory()->create(['nombre' => 'Amiga']);
        $desconocido = Usuario::factory()->create();
        $yo->seguidos()->attach($amiga->id);

        $deAmiga = Actividad::factory()->create();
        $deAmiga->inscritos()->attach($amiga->id);
        $pasado = Actividad::factory()->create(['fecha_hora_inicio' => now()->subDay()]);
        $pasado->inscritos()->attach($amiga->id);
        $deOtro = Actividad::factory()->create();
        $deOtro->inscritos()->attach($desconocido->id);

        $this->actingAs($yo)
            ->getJson('/api/social/planes')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $deAmiga->id)
            ->assertJsonPath('0.seguidos_que_van.0.nombre', 'Amiga');
    }

    public function test_el_perfil_publico_incluye_el_historial_de_planes_pasados(): void
    {
        $usuario = Usuario::factory()->create();
        $organizado = Actividad::factory()->creadaPor($usuario)->create(['fecha_hora_inicio' => now()->subDays(10)]);
        $asistido = Actividad::factory()->create(['fecha_hora_inicio' => now()->subDay()]);
        $proximo = Actividad::factory()->create();
        $organizado->inscritos()->attach($usuario->id);
        $asistido->inscritos()->attach($usuario->id);
        $proximo->inscritos()->attach($usuario->id);

        $this->getJson("/api/usuarios/{$usuario->id}")
            ->assertOk()
            ->assertJsonPath('realizadas', 2)
            ->assertJsonPath('organizadas', 1)
            ->assertJsonCount(1, 'proximas')
            ->assertJsonCount(2, 'historial')
            ->assertJsonPath('historial.0.id', $asistido->id)
            ->assertJsonPath('historial.1.id', $organizado->id);
    }
}
