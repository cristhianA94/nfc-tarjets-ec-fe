# Administración de clientes y tarjetas NFC

Aplicación web en español para administrar negocios y sus tarjetas NFC con destinos web HTTP/HTTPS de cualquier dominio. Un cliente puede tener varias tarjetas, por ejemplo una en cada mesa de un restaurante. Todas comparten el enlace de destino del cliente; cada tarjeta conserva su código, identificación y estado propios.

- Sitio del proyecto: [nfc-tarjets-ec.netlify.app](https://nfc-tarjets-ec.netlify.app/admin/login).
- Repositorio: [cristhianA94/nfc-tarjets-ec-fe](https://github.com/cristhianA94/nfc-tarjets-ec-fe).

Este README describe el código actual del repositorio. La versión publicada y las migraciones aplicadas en Supabase se deben comprobar por separado.

## Arquitectura

Todo el código está en **un solo repositorio**. No se necesita el antiguo repositorio backend ni ejecutar un segundo servidor Node.js.

| Parte                                | Implementación                                   |
| ------------------------------------ | ------------------------------------------------ |
| Interfaz y servidor HTTP             | Next.js 16 con App Router, React 19 y TypeScript |
| Estilos                              | Tailwind CSS 4                                   |
| Base de datos                        | Supabase PostgreSQL                              |
| Autenticación                        | Supabase Auth y Supabase SSR, con cookies        |
| Operaciones privadas y redirecciones | Route Handlers de Next.js                        |
| Hosting configurado                  | Netlify                                          |
| Pruebas de aplicación                | Vitest                                           |
| Pruebas SQL                          | PostgreSQL embebido con PGlite                   |

Las versiones exactas de las dependencias están en `package.json` y `package-lock.json`.

La aplicación incluye clientes, tarjetas, activación presencial, redirecciones y reportes con CSV. Los QR se generan e imprimen manualmente con el enlace directo del negocio, fuera del software. No incluye escritura NFC desde el navegador, lectura del UID físico, cámara, cobros, suscripciones ni seguimiento de visitantes.

## Inicio local

Requisitos: Node.js 22 y npm. El uso de Supabase alojado no requiere Docker.

Desde la raíz del repositorio:

```powershell
npm ci
```

Crea `.env.local` con estas variables y sustituye los valores entre corchetes por los de tu proyecto:

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=[URL_DEL_PROYECTO_SUPABASE]
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[CLAVE_PUBLICABLE_SUPABASE]
```

No se incluye aquí ningún valor real de credenciales. La clave anon legacy también puede usarse en la variable de clave publicable.

`NEXT_PUBLIC_APP_URL` debe ser el origen de la aplicación, sin subruta, parámetros ni fragmentos. Se requiere HTTPS salvo para `localhost` y `127.0.0.1` en desarrollo. Accede con el mismo origen configurado: cambiar entre `localhost` y `127.0.0.1` afecta la validación de las escrituras.

Configura Supabase y aplica las migraciones indicadas a continuación. Después:

```powershell
npm run dev
```

Abre [el acceso local](http://localhost:3000/admin/login). Si cambias las variables, reinicia el servidor. Si faltan variables, las páginas administrativas muestran instrucciones de configuración.

`.env.local` está excluido de Git. La aplicación no requiere una clave `service_role`; no introduzcas claves privadas en variables `NEXT_PUBLIC_*`.

## Configurar Supabase

### Proyecto nuevo

1. Crea un proyecto en Supabase.
2. En Authentication desactiva el registro público de usuarios y el inicio de sesión anónimo. El panel no tiene formulario de registro.
3. En SQL Editor ejecuta una vez [crear_tablas_app.sql](supabase/scripts/crear_tablas_app.sql). Este archivo crea toda la estructura actual: clientes, tarjetas, administradores, RLS, índices, triggers y destinos HTTP/HTTPS de cualquier dominio. Úsalo sobre una base sin objetos de la aplicación. No ejecutes también las tres migraciones sobre esa misma base. Las migraciones originales se conservan para actualizaciones y pruebas; el script unificado no cambia el historial de Supabase CLI.
4. Crea el primer administrador como se explica más abajo.
5. En Authentication > URL Configuration configura Site URL con el origen que usarás para la aplicación.
6. Copia Project URL y la clave publicable a las variables de entorno.

La configuración de `supabase/config.toml` corresponde al entorno local; no cambia automáticamente los ajustes de un proyecto alojado.

### Primer administrador

1. En Authentication > Users crea manualmente el usuario con correo y contraseña.
2. Confirma el correo del usuario.
3. Copia su UUID y ejecuta en SQL Editor:

```sql
insert into public.admin_users (user_id)
values ('REEMPLAZAR_POR_UUID_DEL_USUARIO');
```

Para revocar su autorización, elimina la fila correspondiente de `admin_users` desde SQL Editor. Un usuario autenticado sin esa fila no puede administrar clientes ni tarjetas.

No guardes la contraseña administrativa en el repositorio.

### Supabase local opcional

Requiere Docker y Supabase CLI instalados por separado. Desde la raíz:

```text
supabase start
supabase db reset
```

`supabase db reset` borra los datos de la instancia local y vuelve a aplicar las migraciones. Úsalo únicamente sobre un entorno de desarrollo cuyos datos puedas descartar. Crea también el administrador local y configura la URL y clave locales en `.env.local`.

## Clientes y tarjetas por mesa

Después de iniciar sesión se abre `/admin/tarjetas`. El menú contiene Clientes, Tarjetas, Reportes y Cerrar sesión.

### Crear un cliente

1. Abre **Clientes**.
2. Introduce el nombre del negocio.
3. Añade su enlace de destino y observaciones si corresponde.
4. Guarda y abre el detalle del cliente.

El enlace puede quedar vacío durante la preparación, pero se necesita uno válido para activar sus tarjetas. El detalle muestra las tarjetas asociadas y su listado permite crear otra ya vinculada al cliente.

### Preparar y activar tarjetas

1. Crea una tarjeta desde el cliente o desde **Tarjetas**.
2. Selecciona el cliente, o déjala sin asignar mientras la preparas.
3. Introduce una identificación opcional de hasta 80 caracteres: `Mesa 1`, `Mesa 2`, `Terraza`, `Caja`, etc.
4. Guarda. El estado inicial es **Disponible** y la base genera un código aleatorio de 10 caracteres.
5. Copia la URL permanente y programa el chip con NFC Tools.
6. Para activarla, selecciona un cliente con enlace válido y pulsa **Guardar y activar**.

Cada tarjeta tiene una URL propia. Ejemplo ilustrativo:

```text
https://nfc-tarjets-ec.netlify.app/r/K7P4X9
```

El código público es inmutable. La identificación de mesa es editable y no es única. El listado permite buscar por código, nombre del cliente o identificación y filtrar por estado.

### Cambiar el enlace y administrar estados

El nombre y el enlace se editan **en el cliente**, no en cada tarjeta. Cambiar el enlace actualiza el destino compartido sin reprogramar los chips.

| Estado                 | Comportamiento de la tarjeta              |
| ---------------------- | ----------------------------------------- |
| Disponible / AVAILABLE | Abre la demostración                      |
| Activa / ACTIVE        | Redirige al enlace compartido del cliente |
| Suspendida / SUSPENDED | Abre la página de indisponibilidad        |

Suspender una tarjeta conserva su asociación y no suspende las demás. Reactivarla requiere que el cliente mantenga un enlace válido.

Para desvincular una tarjeta activa, cambia su estado a Disponible; también puedes reasignarla a otro cliente que tenga un enlace válido. No se puede dejar sin enlace a un cliente con tarjetas activas.

Eliminar una tarjeta requiere confirmación y hace que su URL responda 404. Si ya se vendió o programó, considera suspenderla. Un cliente solo puede eliminarse cuando no tiene tarjetas asociadas: primero debes reasignarlas o desvincularlas.

## Modelo de datos

| Tabla         | Datos principales                                                          |
| ------------- | -------------------------------------------------------------------------- |
| `clients`     | UUID, nombre del negocio, enlace compartido, observaciones y fechas        |
| `cards`       | UUID, código público, `client_id`, `label`, estado, observaciones y fechas |
| `admin_users` | UUID vinculado a Supabase Auth y fecha de alta                             |

La relación es `clients.id → cards.client_id`: un cliente puede tener muchas tarjetas. La clave foránea bloquea la eliminación de clientes con tarjetas.

`cards.business_name` y `cards.google_review_url` permanecen como proyecciones sincronizadas mediante triggers para las búsquedas, listas y reportes existentes. Los permisos impiden editarlas directamente con el rol administrativo habitual. **La fuente del nombre y del enlace es `clients`**; `resolve_card` consulta el destino directamente desde esa tabla.

La base también aplica unicidad del código, inmutabilidad, validación de destinos y condiciones de activación. La primera fecha de activación se conserva al editar, suspender o reactivar una tarjeta.

## URLs de destino

Se admiten URLs completas HTTP o HTTPS de cualquier dominio: sitios web, menús, tiendas, redes sociales, enlaces de Google u otros destinos. Se admiten puertos, parámetros y fragmentos; la aplicación conserva la codificación de la consulta al guardar.

Ejemplos:

- `https://ejemplo.com/menu?mesa=1#carta`
- `http://ejemplo.com:8080/catalogo`
- `https://wa.me/123456789`

Se mantiene un máximo de 2048 caracteres y la validación de URL web. No se admiten rutas relativas ni esquemas como `javascript:`, `data:`, `file:` o `mailto:`.

La aplicación valida con el analizador estándar de URL y SQL aplica una comprobación básica de formato. El servidor no descarga ni sigue el destino para comprobar su contenido o disponibilidad.

Por compatibilidad, la columna y el campo de API conservan el nombre `google_review_url`, y la función SQL conserva el nombre `valid_review_url`. Ambos admiten ahora destinos web ajenos a Google.

## Redirecciones públicas

`GET /r/[codigo]` usa un cliente Supabase sin sesión administrativa y consulta `resolve_card`.

| Caso                                | Respuesta                   |
| ----------------------------------- | --------------------------- |
| Tarjeta disponible                  | HTTP 302 a `/demo`          |
| Tarjeta activa con destino admitido | HTTP 302 directo al destino |
| Tarjeta suspendida                  | HTTP 302 a `/no-disponible` |
| Código inexistente o inválido       | HTTP 404                    |
| Error de conexión o configuración   | HTTP 503                    |

La redirección activa se realiza en el servidor, sin una página intermedia ni un segundo botón. La ruta envía cabeceras `no-store` y no cambia su comportamiento según la sesión del administrador.

La función pública devuelve únicamente estado y destino activo de un código exacto; no permite listar clientes ni consultar sus observaciones.

## Reportes y CSV

`/admin/reportes` muestra:

- Total de tarjetas y cantidades actuales por estado.
- Activaciones durante un rango de fechas inclusivo, calculado en UTC.
- Listado paginado de 25 activaciones.
- Exportación CSV del periodo completo.

La fecha corresponde a la **primera activación**, no a cada reactivación. Los totales por estado son globales; el rango se aplica a las activaciones y a su exportación.

El CSV incluye código, cliente, identificación, fecha de activación UTC y estado. Se exporta con BOM UTF-8, comillas escapadas y protección de celdas que comienzan con prefijos de fórmulas. La consulta se pagina para no limitar el archivo a una sola respuesta de Supabase.

Las tarjetas eliminadas dejan de contarse. No hay historial de eliminaciones, auditoría de cambios ni analítica de escaneos.

## Despliegue en Netlify

[netlify.toml](netlify.toml) configura Node.js 22, `npm run build` y el directorio `.next`. El proyecto utiliza servidor y Route Handlers; no se debe publicar como una exportación estática de HTML.

1. Sube el código actualizado al repositorio GitHub conectado a Netlify, o usa tu flujo de despliegue con Netlify CLI.
2. Usa la raíz de este repositorio como directorio base.
3. Configura las tres variables para la compilación y las funciones de producción:
   - `NEXT_PUBLIC_APP_URL=https://nfc-tarjets-ec.netlify.app`
   - `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: clave publicable del proyecto.
4. Comprueba que la base tiene aplicadas las migraciones requeridas.
5. Despliega. Después de cambiar variables `NEXT_PUBLIC_*`, vuelve a compilar y desplegar.
6. Establece el mismo origen en Site URL de Supabase Auth.
7. Comprueba login, clientes, asignación de varias tarjetas, cambio del enlace compartido, suspensión individual, redirecciones y CSV.

Consulta los límites vigentes del plan en la [página de Netlify](https://www.netlify.com/pricing/).

## Optimización de recursos

El panel usa reportes de una sola consulta RPC, listados con columnas reducidas, búsqueda explícita de clientes y enlaces privados sin precarga automática. El selector reutiliza cada búsqueda hasta 30 segundos dentro del componente. La sesión se verifica con Supabase getClaims y las comprobaciones de servidor se reutilizan dentro del mismo render, sin almacenar permisos globalmente.

El CSV cuenta una vez y pagina usando las filas realmente recibidas. El trigger de clientes evita reescribir tarjetas al modificar solo notas o enviar el mismo nombre y enlace.

Si ya aplicaste las migraciones 001, 002 y 003, ejecuta únicamente [202611150004_efficiency.sql](supabase/migrations/202611150004_efficiency.sql) antes de desplegar esta versión. El [script único de creación](supabase/scripts/crear_tablas_app.sql) ya incluye las cuatro migraciones.

Consulta [EFICIENCIA.md](docs/EFICIENCIA.md) para los cambios, límites de caché y resultados de validación. Las redirecciones NFC siguen consultando el destino actual en cada apertura.

## Comandos y pruebas

| Comando              | Uso                                            |
| -------------------- | ---------------------------------------------- |
| `npm ci`             | Instalar las versiones del lockfile            |
| `npm run dev`        | Servidor de desarrollo                         |
| `npm run lint`       | Revisar el código con ESLint                   |
| `npm run typecheck`  | Generar tipos de rutas y ejecutar TypeScript   |
| `npm test`           | Ejecutar las suites de aplicación y SQL        |
| `npm run test:unit`  | Pruebas Vitest                                 |
| `npm run test:db`    | Pruebas SQL con PGlite                         |
| `npm run test:watch` | Vitest en modo interactivo                     |
| `npm run build`      | Compilación de producción                      |
| `npm start`          | Servir una compilación de producción existente |

Las pruebas Vitest usan clientes Supabase simulados para comprobar autenticación, autorización, clientes, tarjetas, redirecciones, validación, fechas y reportes.

Las pruebas SQL ejecutan las migraciones reales en PostgreSQL embebido PGlite, recreando los roles y el contrato `auth.uid()`. Cubren RLS, permisos, unicidad, migración de tarjetas existentes, enlace compartido, suspensión independiente, eliminación, desvinculación y marcas de tiempo. No modifican Supabase alojado.

La última ejecución registrada durante la implementación aprobó **64 pruebas de aplicación y 13 SQL**, además de lint, TypeScript y build. Ese resultado no verifica por sí solo el despliegue actual, una sesión real de administrador ni etiquetas físicas.

El archivo [.gitlab-ci.yml](.gitlab-ci.yml) contiene una pipeline para esas verificaciones. Es una configuración de GitLab; el repositorio actual está en GitHub y ese archivo no configura GitHub Actions. El build de Netlify está definido por separado.

## Seguridad

- Identidad verificada en servidor con Supabase Auth y autorización explícita en `admin_users`.
- Políticas RLS para clientes, tarjetas y administradores.
- Escrituras con validación de origen contra `NEXT_PUBLIC_APP_URL`.
- Cookies de sesión HttpOnly, SameSite=Lax y Secure en producción, administradas por Supabase SSR.
- Renovación de sesión mediante `src/proxy.ts`.
- Sin JWT personalizados ni almacenamiento manual de tokens en localStorage.
- Lectura pública limitada a la función de resolución de tarjetas.
- Sin registro de datos personales de visitantes en la lógica de redirección de la aplicación. Los logs del proveedor de hosting se configuran por separado.

## Estructura del repositorio

```text
src/
  app/
    admin/                 Login, clientes, tarjetas y reportes
    api/admin/             Route Handlers administrativos
    r/[codigo]/            Redirección NFC
    demo/                  Demostración de tarjeta disponible
    no-disponible/         Tarjeta suspendida
  components/              Formularios, listados y navegación
  lib/                     Autorización, Supabase, validación, tipos y reportes
  proxy.ts                 Renovación de sesiones
supabase/
  migrations/              Esquema inicial, clientes, destinos web y eficiencia
  config.toml              Configuración local de Supabase
tests/                     Pruebas de aplicación y SQL
docs/                      Documentos auxiliares e informes históricos
netlify.toml               Configuración de despliegue
```

Los documentos históricos de `docs/` pueden describir etapas anteriores. Para la arquitectura y el flujo de uso actuales, utiliza este README y las migraciones del repositorio.

## Rutas

| Tipo            | Rutas                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| Públicas        | `/demo`, `/no-disponible`, `/r/[codigo]`                                  |
| Acceso          | `/admin/login`                                                            |
| Clientes        | `/admin/clientes`, `/admin/clientes/[id]`                                 |
| Tarjetas        | `/admin/tarjetas`, `/admin/tarjetas/nueva`, `/admin/tarjetas/[codigo]`    |
| Reportes        | `/admin/reportes`                                                         |
| API de sesión   | `POST /api/admin/login`, `POST /api/admin/logout`                         |
| API de clientes | `GET/POST /api/admin/clients`, `PATCH/DELETE /api/admin/clients/[id]`     |
| API de tarjetas | `GET/POST /api/admin/cards`, `GET/PATCH/DELETE /api/admin/cards/[codigo]` |
| API de reportes | `GET /api/admin/reports`, `GET /api/admin/reports/csv`                    |
