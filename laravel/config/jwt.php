<?php

/*
 * Solo se sobrescriben los valores relevantes; el resto viene de la configuración del paquete.
 * El secreto se genera con `php artisan jwt:secret`.
 */
return [

    'secret' => env('JWT_SECRET'),

    // Minutos de validez de un token.
    'ttl' => (int) env('JWT_TTL', 120),

    // Minutos durante los que un token caducado aún puede renovarse (14 días).
    'refresh_ttl' => (int) env('JWT_REFRESH_TTL', 20160),

];
