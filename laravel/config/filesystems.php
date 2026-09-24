<?php

return [

    'default' => env('FILESYSTEM_DISK', 'local'),

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => env('APP_URL').'/storage',
            'visibility' => 'public',
            'throw' => false,
        ],

        // Banco de fotos: se guarda directamente en public/fotos para que Apache
        // lo sirva sin necesidad de `storage:link` (enlaces simbólicos en Windows).
        'fotos' => [
            'driver' => 'local',
            'root' => public_path('fotos'),
            'url' => env('APP_URL').'/fotos',
            'visibility' => 'public',
            'throw' => false,
        ],

    ],

    'links' => [],

];
