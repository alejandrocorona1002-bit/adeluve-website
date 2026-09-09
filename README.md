# ADELUUVE — Sitio completo

Esta versión conserva como base el contenido del documento corporativo proporcionado y agrega mejoras de presentación y administración sin inventar datos de contacto ni nuevos servicios.

## 1. Configuración única
Edita `config.js` y coloca:
- `SUPABASE_URL`: Project URL de Supabase, terminada en `.supabase.co`.
- `SUPABASE_KEY`: Publishable / anon key.
- `CONTACT`: teléfono, correo y cobertura solo cuando los tengas definidos.

No uses `service_role` ni una secret key.

## 2. Supabase
En `Supabase > SQL Editor`, ejecuta `supabase/SETUP_COMPLETO.sql`.

Si ya existen tus tablas, el archivo usa `create table if not exists` y recrea únicamente las policies de este paquete.

### Crear el administrador
1. `Supabase > Authentication > Users > Add user`.
2. Crea el correo y contraseña del administrador.
3. Copia el UUID del usuario.
4. En SQL Editor ejecuta:
   `insert into public.administradores(user_id) values ('TU_UUID');`

Después podrás entrar en `/admin/`.

## 3. Panel /admin
Permite:
- iniciar sesión con Supabase Auth;
- ver métricas;
- consultar solicitudes;
- cambiar el estatus de una solicitud;
- crear proyectos/trabajos;
- subir varias imágenes desde computadora o celular;
- editar publicaciones;
- publicar/ocultar;
- eliminar publicaciones.

Las imágenes se guardan en el bucket público `proyectos`.

## 4. Formulario
El sitio público guarda en `contactos` y muestra un folio si Supabase devuelve el `id`.
Estados utilizados por el panel:
- Nuevo
- Contactado
- En seguimiento
- Cotización
- Finalizado

## 5. Correos con Resend
La función incluida está en `supabase/functions/notificar-contacto/index.ts`.

Secrets recomendados:
- `RESEND_API_KEY`
- `CONTACT_NOTIFICATION_EMAIL`
- `RESEND_FROM_EMAIL` (opcional; si se omite usa `onboarding@resend.dev`)
- `SEND_CLIENT_CONFIRMATION` = `false` por defecto

Tu Database Webhook debe ejecutar `notificar-contacto` en `INSERT` de `public.contactos`.

La confirmación automática al cliente está preparada pero desactivada hasta que decidas activarla y Resend tenga un remitente permitido para enviar a terceros.

## 6. Archivos de identidad
- `assets/logo.png`: logo extraído del documento compartido.
- `assets/favicon.png`: favicon proporcionado en la conversación.

## 7. GitHub / Vercel
Sube todo el contenido de esta carpeta a la raíz del repositorio. Si Vercel está conectado, desplegará automáticamente.

Después de cada actualización usa `Ctrl + F5` si el navegador conserva archivos viejos en caché.

## 8. Dominio / SEO
Hasta que exista un dominio definitivo, este paquete no fija `canonical` ni `sitemap.xml` para no inventar una URL. Cuando el dominio esté definido se agregan ambos con la dirección real.
