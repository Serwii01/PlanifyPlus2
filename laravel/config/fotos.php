<?php

/*
 * Banco de fotos.
 *
 * `temas`: etiqueta en español => búsquedas en inglés en Openverse (fotos CC0 / CC BY).
 * Evita la palabra "outdoor" en las búsquedas: la bloquea el cortafuegos de Openverse.
 * El comando `php artisan fotos:importar` descarga varias fotos por tema.
 */
return [

    'ancho_maximo' => 1600,
    'tamano_maximo_kb' => 6144,

    'temas' => [
        'padel' => ['padel court', 'padel tennis racket'],
        'futbol' => ['football pitch amateur', 'soccer ball grass'],
        'baloncesto' => ['basketball court', 'basketball players'],
        'tenis' => ['tennis court', 'tennis racket ball'],
        'running' => ['running group park', 'jogging city'],
        'ciclismo' => ['cycling group road', 'bicycle ride countryside'],
        'senderismo' => ['hiking trail mountains', 'group hiking'],
        'yoga' => ['yoga class', 'yoga mat park'],
        'zumba' => ['zumba dance class', 'fitness dance class'],
        'natacion' => ['swimming pool lanes', 'open water swimming'],
        'escalada' => ['climbing wall indoor', 'rock climbing'],
        'voleibol' => ['beach volleyball', 'volleyball net'],
        'ceramica' => ['pottery wheel hands', 'ceramics workshop'],
        'cocina' => ['cooking class kitchen', 'homemade pasta making'],
        'fotografia' => ['photography workshop camera', 'street photography'],
        'pintura' => ['painting workshop easel', 'watercolor painting hands'],
        'musica' => ['live concert small venue', 'acoustic guitar jam'],
        'cine' => ['cinema seats projector', 'film screening audience'],
        'teatro' => ['theatre stage curtain', 'theater performance'],
        'poesia' => ['poetry reading microphone', 'open mic cafe'],
        'lectura' => ['book club reading', 'library books'],
        'juegos de mesa' => ['board game night', 'board games table dice'],
        'idiomas' => ['language exchange conversation', 'people talking cafe'],
        'gastronomia' => ['tapas bar friends', 'wine tasting glasses'],
        'naturaleza' => ['picnic park friends', 'sunset viewpoint people'],
        'voluntariado' => ['volunteers cleaning beach', 'community garden volunteers'],
    ],

];
