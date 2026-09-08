# ADELUUVE — versión actualizada

## Antes de publicar
1. Abre `script.js`.
2. Reemplaza `PEGA_AQUI_TU_PROJECT_URL` por tu URL base de Supabase, por ejemplo `https://xxxx.supabase.co`. **No agregues `/rest/v1`.**
3. Reemplaza `PEGA_AQUI_TU_PUBLISHABLE_KEY` por tu Publishable key / anon key.
4. Sube `index.html`, `styles.css`, `script.js` y la carpeta `assets` a GitHub.
5. Vercel desplegará automáticamente si ya está conectado al repositorio.

## Proyectos
La web lee `public.proyectos`. Una imagen principal se toma de `imagen_url`.

## Varias imágenes por proyecto
Ejecuta una sola vez `SQL_IMAGENES_MULTIPLES.sql`. Después agrega filas en `proyecto_imagenes`, usando el `id` del proyecto en `proyecto_id`. La web detecta esa tabla automáticamente y muestra un carrusel.

## Contactos
Los formularios se guardan en `Table Editor > contactos`.
