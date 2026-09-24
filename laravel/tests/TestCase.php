<?php

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    /**
     * En los tests todas las peticiones comparten el mismo proceso, y el guard JWT y el
     * token parseado son singletons. Cuando una petición lleva su propio token, se limpia
     * ese estado para que se autentique con él, como ocurre con peticiones HTTP reales.
     * Las peticiones sin token conservan el usuario fijado con `actingAs()`.
     */
    public function call($method, $uri, $parameters = [], $cookies = [], $files = [], $server = [], $content = null)
    {
        if (isset($server['HTTP_AUTHORIZATION'])) {
            $this->app['auth']->forgetGuards();
            $this->app['tymon.jwt']->unsetToken();
        }

        return parent::call($method, $uri, $parameters, $cookies, $files, $server, $content);
    }
}
