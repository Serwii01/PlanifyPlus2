<?php

namespace Tests\Feature;

use App\Models\Usuario;
use Tests\TestCase;

class AuthTest extends TestCase
{
    public function test_el_registro_crea_el_usuario_con_sus_coordenadas_y_devuelve_un_token(): void
    {
        $respuesta = $this->postJson('/api/registro', [
            'nombre' => 'Sergio',
            'email' => 'sergio@prueba.com',
            'contrasena' => 'secreto',
            'ciudad' => 'Sevilla',
        ])->assertCreated()->assertJsonPath('usuario.es_admin', false);

        $usuario = Usuario::firstWhere('email', 'sergio@prueba.com');
        $this->assertEqualsWithDelta(37.3891, $usuario->latitud, 0.0001);
        $this->assertNotSame('secreto', $usuario->contrasena);

        $this->withToken($respuesta->json('token'))->getJson('/api/perfil')->assertOk();
    }

    public function test_el_registro_rechaza_correos_repetidos_y_contrasenas_cortas(): void
    {
        Usuario::factory()->create(['email' => 'repetido@prueba.com']);

        $this->postJson('/api/registro', [
            'nombre' => 'Otro',
            'email' => 'repetido@prueba.com',
            'contrasena' => '123',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email', 'contrasena']);
    }

    public function test_el_login_devuelve_token_y_distingue_cuenta_inexistente_de_contrasena_incorrecta(): void
    {
        $usuario = Usuario::factory()->create(['email' => 'ana@prueba.com']);

        $this->postJson('/api/login', ['email' => 'nadie@prueba.com', 'contrasena' => 'secreto123'])
            ->assertNotFound();

        $this->postJson('/api/login', ['email' => 'ana@prueba.com', 'contrasena' => 'incorrecta'])
            ->assertUnauthorized();

        $respuesta = $this->postJson('/api/login', ['email' => 'ANA@prueba.com', 'contrasena' => 'secreto123'])
            ->assertOk()
            ->assertJsonPath('usuario.id', $usuario->id)
            ->assertJsonStructure(['token', 'expira_en']);

        $this->withToken($respuesta->json('token'))
            ->getJson('/api/perfil')
            ->assertOk()
            ->assertJsonPath('email', 'ana@prueba.com');
    }

    public function test_el_token_se_renueva_y_el_logout_lo_invalida(): void
    {
        $token = $this->postJson('/api/login', [
            'email' => Usuario::factory()->create()->email,
            'contrasena' => 'secreto123',
        ])->json('token');

        $nuevo = $this->withToken($token)->postJson('/api/refresh')->assertOk()->json('token');
        $this->assertNotSame($token, $nuevo);

        $this->withToken($nuevo)->postJson('/api/logout')->assertNoContent();
        $this->withToken($nuevo)->getJson('/api/perfil')->assertUnauthorized();
    }

    public function test_el_perfil_se_actualiza_sin_cambiar_la_contrasena_si_no_se_envia(): void
    {
        $usuario = Usuario::factory()->create();
        $hashOriginal = $usuario->contrasena;

        $this->actingAs($usuario)->putJson('/api/perfil', [
            'nombre' => 'Nuevo nombre',
            'email' => $usuario->email,
            'contrasena' => '',
            'ciudad' => 'Madrid',
        ])->assertOk()->assertJsonPath('ciudad', 'Madrid');

        $usuario->refresh();
        $this->assertSame('Nuevo nombre', $usuario->nombre);
        $this->assertSame($hashOriginal, $usuario->contrasena);
        $this->assertEqualsWithDelta(40.4168, $usuario->latitud, 0.0001);
    }

    public function test_la_direccion_exacta_manda_sobre_las_coordenadas_de_la_ciudad(): void
    {
        $this->postJson('/api/registro', [
            'nombre' => 'Lucía',
            'email' => 'lucia@prueba.com',
            'contrasena' => 'secreto',
            'ciudad' => 'Sevilla',
            'direccion' => 'Calle Betis, 1, Triana, Sevilla',
            'latitud' => 37.3823,
            'longitud' => -6.0025,
        ])->assertCreated()
            ->assertJsonPath('usuario.direccion', 'Calle Betis, 1, Triana, Sevilla')
            ->assertJsonPath('usuario.latitud', 37.3823);

        $usuario = Usuario::firstWhere('email', 'lucia@prueba.com');
        $this->assertEqualsWithDelta(-6.0025, $usuario->longitud, 0.0001);

        // Al quitar la dirección se vuelve al centro de la ciudad elegida.
        $this->actingAs($usuario)->putJson('/api/perfil', [
            'nombre' => 'Lucía',
            'email' => 'lucia@prueba.com',
            'ciudad' => 'Madrid',
            'direccion' => null,
        ])->assertOk()->assertJsonPath('direccion', null)->assertJsonPath('latitud', 40.4168);
    }

    public function test_la_direccion_exige_sus_coordenadas(): void
    {
        $usuario = Usuario::factory()->create();

        $this->actingAs($usuario)->putJson('/api/perfil', [
            'nombre' => $usuario->nombre,
            'email' => $usuario->email,
            'ciudad' => 'Sevilla',
            'direccion' => 'Plaza de España, Sevilla',
        ])->assertUnprocessable()->assertJsonValidationErrors(['latitud', 'longitud']);
    }

    public function test_las_rutas_privadas_exigen_sesion(): void
    {
        $this->getJson('/api/perfil')->assertUnauthorized();
        $this->postJson('/api/actividades', [])->assertUnauthorized();
        $this->withToken('token-falso')->getJson('/api/perfil')->assertUnauthorized();
    }
}
