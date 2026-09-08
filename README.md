# ADELUUVE — versión premium

## Archivos a subir a GitHub
- `index.html`
- `styles.css`
- `script.js`
- carpeta `assets/` con `logo.png`

## Antes de subir
En `script.js`, reemplaza:

```js
const SUPABASE_URL = "PEGA_AQUI_TU_PROJECT_URL";
const SUPABASE_KEY = "PEGA_AQUI_TU_PUBLISHABLE_KEY";
```

por la misma Project URL y Publishable/anon key que ya usas.

## Esta versión conserva
- formulario a tabla `contactos`
- tabla `proyectos`
- tabla opcional `proyecto_imagenes`
- galería y filtros
- modal con varias imágenes

## Mejoras visuales
- `Quiénes somos` es la primera sección visible
- portada completamente nueva
- navegación activa por sección
- barra de progreso de página
- animaciones reveal, flotación, burbujas y ondas
- metodología animada
- galería tipo editorial/mosaico
- carrusel con miniaturas, teclado y swipe móvil
- diseño responsive más completo

## Publicación
1. Reemplaza los archivos en GitHub.
2. Commit changes.
3. Vercel detectará el commit y desplegará automáticamente.
4. Haz Ctrl+F5 cuando termine el deployment.
