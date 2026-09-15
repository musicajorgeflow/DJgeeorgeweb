# Web Final

Esta carpeta contiene la web lista para subir a GitHub Pages u otro hosting estático.

Para añadir un mashup, abre `mashups/Agregar Mashup.command` y elige una opción: `1` añade un mashup normal, `2` importa una lista en bloque desde el portapapeles y `3` edita un mashup ya publicado. Para el modo bloque, copia desde tu bloc de notas los títulos y enlaces de SoundCloud; el comando los detectará y te pedirá el audio preview de cada mashup uno por uno.

En `3`, selecciona el mashup por número y podrás cambiar el título, el enlace de YouTube, el enlace de SoundCloud (actualiza automáticamente portada y Buy) y, si quieres, arrastrar una portada personalizada. Deja un campo vacío para conservarlo.

En ambos modos, tras obtener el título buscará vídeos parecidos en el canal de YouTube de DJgeeorge y te enseñará el título del resultado antes de usarlo. Puedes aceptarlo, ver alternativas, buscar con otro texto o pegar el enlace manualmente. Si ese mashup no tiene vídeo completo, elige `H` o escribe `no hay`: en la web aparecerá «Vídeo completo próximamente en YouTube».

Pega el enlace de la canción en SoundCloud para que el comando descargue su portada automáticamente y use el enlace **Buy** de esa página para el botón «Descargar» de la web. Si esa canción no tiene Buy, el botón queda desactivado. Si dejas el enlace de SoundCloud vacío, puedes arrastrar una imagen propia y pegar manualmente el enlace de descarga/Buy.

Al añadir cada mashup, puedes elegir opcionalmente el degradado del botón «Descargar»: pega dos o tres colores hexadecimales separados por comas, por ejemplo `1677ff, ff5426` o `#1677ff, #ff5426, ffd166`. Pulsa Enter para usar el degradado predeterminado.

La primera vez que uses la búsqueda de YouTube, pega tu API key cuando el comando te la pida. Se guarda solo en `mashups/.youtube-api-key`, con permisos privados y fuera de Git.

Puedes dejar el enlace de YouTube y el preview vacíos. En ese caso, sus controles aparecerán como no disponibles; la tarjeta se publicará igualmente.

El botón Compartir abre el selector de apps del móvil y crea un enlace único por mashup bajo `https://djgeeorge.qd.je/descargas/?m=...`.
