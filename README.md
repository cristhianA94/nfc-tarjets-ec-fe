# Administración de tarjetas NFC

Aplicación Next.js con App Router, TypeScript, Tailwind CSS y Supabase. Interfaz en español para un administrador. Incluye tarjetas, activación rápida, estados, redirecciones HTTP 302 y reportes con CSV. La generación y administración de QR quedan fuera del software.

## Repositorios

- Frontend: `D:\Works\NFC\frontend\nfc-tarjets-ec-fe`. Contiene la interfaz, sesiones SSR y Route Handlers de Next.js.
- Backend: `D:\Works\NFC\backend\nfc-tarjets-ec-backnd`. Contiene la base de datos Supabase, migraciones, RLS y pruebas SQL.
- No se necesita ejecutar un segundo servidor Node. Supabase proporciona PostgreSQL y Auth; los Route Handlers se despliegan junto a Next.js.

## Inicio local

Requisito: Node.js 22 o posterior compatible con las dependencias del lockfile y npm.

1. Configura Supabase según el README del repositorio backend.
2. Desde este repositorio ejecuta `npm ci`.
3. Copia `.env.example` a `.env.local`.
4. Completa las tres variables:
   - `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
   - `NEXT_PUBLIC_SUPABASE_URL`: URL de tu proyecto.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: clave publicable de tu proyecto. También admite una clave anon legacy en esta misma variable.
5. Ejecuta `npm run dev` y abre http://localhost:3000/admin/login.

La aplicación muestra instrucciones de configuración si faltan variables. No crea usuarios, tarjetas ni credenciales de ejemplo.

El backend no usa service_role. La clave publicable se usa junto con RLS. No pongas secretos en variables NEXT_PUBLIC.

## Supabase y primer administrador

1. Crea el proyecto en Supabase.
2. En Authentication desactiva **Allow new users to sign up** y el acceso anónimo. No habilites proveedores que no vayas a usar.
3. En SQL Editor ejecuta el archivo `supabase/migrations/202611150001_nfc.sql` del backend. Aplícalo una vez en una base nueva.
4. En Authentication > Users > Add user > Create new user crea manualmente el correo y contraseña del administrador. Marca el correo como confirmado.
5. Copia el UUID del usuario y ejecuta en SQL Editor:

```sql
insert into public.admin_users(user_id)
values ('REEMPLAZAR_POR_UUID_DEL_USUARIO');
```

6. En Authentication > URL Configuration establece Site URL al origen definitivo de la aplicación.
7. Guarda URL y clave publicable en las variables del frontend. No copies la contraseña administrativa a un archivo del repositorio.

Un usuario autenticado sin fila en admin_users no puede operar tarjetas. No hay formulario público de registro ni operaciones de alta de administradores en la aplicación. Para revocar el acceso, elimina su fila en admin_users desde SQL Editor.

## Uso

Después del login se abre /admin/tarjetas.

1. Pulsa **Nueva tarjeta**. Nombre, enlace y observaciones son opcionales; el estado inicial es Disponible.
2. Guarda para generar un código aleatorio de 10 caracteres y una URL /r/CODIGO.
3. Copia esa URL y programa la etiqueta con NFC Tools.
4. Durante la venta busca el código o abre /admin/tarjetas/CODIGO.
5. Introduce nombre del negocio y enlace de Google Reviews; pulsa **Guardar y activar**.
6. Prueba la URL NFC y después una etiqueta física.
7. Puedes editar el enlace sin cambiar el código ni la URL. Suspender conserva los datos e impide la redirección a Google; reactivar vuelve a validar los campos.
8. Eliminar requiere confirmación y hace que la URL responda 404. Para tarjetas vendidas se recomienda suspender.

### Enlaces admitidos

- https://g.page/r/IDENTIFICADOR/review
- https://search.google.com/local/writereview?placeid=IDENTIFICADOR
- https://maps.app.goo.gl/IDENTIFICADOR, con parámetro opcional g_st.

Se comprueban HTTPS, host exacto y ruta; no se siguen destinos arbitrarios desde el servidor. Los enlaces cortos de Google Maps se aceptan por su formato y host. **No puedo verificar que un enlace introducido abra el formulario de reseñas del negocio correcto.** El administrador debe abrirlo y comprobarlo antes de vender la tarjeta. Otros formatos, redirecciones genéricas /url y dominios distintos se rechazan. La lista se aplica en TypeScript y en SQL.

### Redirección pública

GET /r/CODIGO consulta la función SQL resolve_card con un cliente anónimo sin sesión administrativa.

- Disponible: HTTP 302 a /demo.
- Activa: HTTP 302 directo al enlace de Google, sin página intermedia.
- Suspendida: HTTP 302 a /no-disponible.
- Código inexistente o mal formado: HTTP 404.
- Error de conexión/configuración: HTTP 503.

Se envían cabeceras no-store también a la CDN. La ruta pública no interpreta la sesión del administrador. La función SQL expone únicamente estado y destino activo de un código exacto, sin nombres ni observaciones.

### Reportes

/admin/reportes muestra totales globales por estado y activaciones filtradas por fecha. El filtro incluye ambos días y utiliza UTC. La fecha corresponde a la **primera activación**, también si la tarjeta se suspende o reactiva después. Las tarjetas eliminadas dejan de contarse: no se conserva historial de eliminaciones.

Listado paginado de 25 activaciones. CSV de todo el periodo filtrado, con BOM UTF-8, comillas escapadas y neutralización de prefijos de fórmulas. La exportación pagina la consulta para superar el límite por respuesta de Supabase. No hay analítica de visitantes.

## Vercel y dominio

1. Importa este repositorio GitLab en Vercel. Framework: Next.js; root directory: raíz de este repositorio; build command: npm run build.
2. Crea las tres variables de .env.example en el entorno de producción. Usa https://tu-dominio-definitivo en NEXT_PUBLIC_APP_URL, sin subruta. Si usas un preview de Vercel, configura ese origen en el entorno Preview.
3. Despliega. No se ha efectuado un despliegue desde este proyecto.
4. Añade el dominio en Vercel y configura los registros DNS que indique.
5. Actualiza NEXT_PUBLIC_APP_URL y Site URL en Supabase con ese dominio, vuelve a desplegar y comprueba login y /r/CODIGO.
6. Revisa las opciones de registro de Supabase también en producción.

**Elige el dominio definitivo antes de grabar las etiquetas NFC.** La URL física depende de conservar ese dominio y la ruta. Cambiar NEXT_PUBLIC_APP_URL no reescribe las etiquetas ya programadas.

## Programar el NFC

1. Abre NFC Tools en un teléfono compatible.
2. Ve a Escribir > Añadir un registro > URL/URI.
3. Pega la URL permanente completa copiada desde la tarjeta.
4. Escribe el registro acercando el teléfono al chip.
5. Lee y prueba la etiqueta desde otro teléfono, primero disponible y luego activa.
6. Evita bloquear definitivamente la escritura mientras estés probando el producto.

Los QR se generan e imprimen manualmente con el enlace directo de Google, fuera de esta aplicación.

## Verificación

```text
npm run lint
npm run typecheck
npm test
npm run build
```

Vitest prueba validación, autorización, login/logout y handlers con clientes Supabase simulados, redirecciones, CRUD, fechas, CSV y reportes. Las pruebas del backend ejecutan la migración real sobre PostgreSQL embebido (PGlite), con el contrato de roles/Auth de Supabase recreado para las pruebas.

Estas pruebas no equivalen a una conexión a tu Supabase ni a una prueba de una etiqueta física. Consulta VALIDACION.md en D:\Works\NFC para los resultados observados.

## Estructura

- src/app/admin: páginas administrativas.
- src/app/api/admin: operaciones privadas, con autorización por petición.
- src/app/r/[codigo]: redirección pública.
- src/lib: validación, sesiones, reportes y CSV.
- src/proxy.ts: renovación de sesión mediante cookies.
- tests: pruebas de unidad y de handlers.

Las operaciones privadas verifican identidad con Supabase Auth y pertenencia a admin_users. Las escrituras comprueban Origin contra NEXT_PUBLIC_APP_URL. El SDK administra las cookies HttpOnly, SameSite=Lax y Secure en producción. No se almacenan tokens manualmente en localStorage. La aplicación no registra datos de los visitantes de /r; la configuración de logs de los proveedores de hosting se gestiona por separado.

Referencias de implementación: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Next.js App Router](https://nextjs.org/docs/app), [Next.js Proxy](https://nextjs.org/docs/app/getting-started/proxy).

## Pruebas SQL integradas
Las migraciones y las pruebas SQL están en este repositorio. Ejecuta npm test para las 60 pruebas de handlers y validación y las 5 pruebas SQL. npm run test:db ejecuta la migración real en PostgreSQL embebido PGlite, con roles y auth.uid() recreados. No modifica el Supabase alojado ni verifica una sesión real del administrador. No se necesita el antiguo repositorio backend.

