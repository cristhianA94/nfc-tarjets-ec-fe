# Optimización de peticiones y recursos

Cambios implementados en el código local. La cuarta migración todavía debe aplicarse al Supabase alojado antes de desplegar esta versión.

## Reducciones comprobables en el código

| Operación | Antes | Ahora |
| --- | --- | --- |
| Datos de reportes | Cinco consultas a Supabase por carga | Una RPC con totales, periodo y página |
| Selector de clientes | Consulta al montar y después de pausas al escribir | Consulta al abrir el selector o pulsar Buscar clientes |
| Datos del selector | Cliente completo, conteo de tarjetas y total exacto | Solo UUID y nombre, hasta 25 resultados |
| Repetir búsqueda del selector | Nueva petición | Resultado reutilizado hasta 30 segundos dentro del mismo componente |
| Enlaces del panel | Precarga automática de Next.js | Precarga desactivada en los enlaces privados |
| Guardar una tarjeta | Respuesta de guardado y router.refresh adicional | Se utiliza la tarjeta devuelta por el servidor |
| Guardar un cliente | Recarga de la ruta y actualización del listado | Se actualiza el listado que corresponde, sin recargar la ruta |
| CSV de varias páginas | Conteo exacto y columnas completas en cada página | Conteo una sola vez y cinco columnas necesarias |
| Cambio de notas del cliente o envío de valores idénticos | Podía actualizar las tarjetas asociadas | El trigger solo actualiza tarjetas cuando cambian nombre o URL |

La columna de reportes compara consultas de datos: la comprobación administrativa sigue siendo independiente. No representa el total de todas las peticiones de una sesión.

## Autenticación

Se usa Supabase Auth getClaims para verificar el JWT. El SDK puede verificarlo mediante claves públicas JWKS cacheadas cuando el proyecto utiliza claves asimétricas. Con claves simétricas, la verificación requiere una petición a Auth. No se cambiaron las claves de firma del proyecto.

La autorización y el cliente SSR se reutilizan mediante React cache exclusivamente dentro del render del servidor. No existe un caché global de permisos entre usuarios o solicitudes. Las operaciones privadas siguen consultando admin_users y aplicando RLS.

Las APIs gestionan sus cookies y renovación de sesión mediante el cliente SSR; no atraviesan además el proxy de páginas. El proxy de /admin mantiene la renovación de cookies de las páginas.

Referencia: [Supabase getClaims](https://supabase.com/docs/reference/javascript/auth-getclaims).

## Base de datos

La RPC get_card_report requiere autorización administrativa explícita y se ejecuta como SECURITY INVOKER, con RLS. Agrega los totales en una consulta y devuelve solo los campos del reporte y 25 filas por página. Los rangos de fecha siguen siendo inclusivos en UTC.

La migración añade índices para el orden por fecha de creación y UUID, nombre de cliente y UUID, y fecha de activación y código. No añade tablas de contadores ni tareas de sincronización.

El CSV avanza por el número de filas realmente recibidas. Esto evita saltarse registros cuando el límite configurado en Supabase es menor que las 500 filas solicitadas. Las páginas posteriores no vuelven a pedir el conteo exacto.

## URLs NFC

Cada apertura de /r/CODIGO conserva una consulta pública resolve_card y las cabeceras no-store. No se añade un caché persistente del destino. Las pruebas comprueban que cambiar el enlace se refleja en la siguiente resolución y que suspender una tarjeta conserva el estado independiente de las demás.

## Aplicar

Para una base existente que ya tiene las migraciones 001, 002 y 003:

1. Ejecuta supabase/migrations/202611150004_efficiency.sql una vez.
2. Despliega el código actualizado en Netlify.
3. Prueba login, clientes, selector, tarjetas, reportes y CSV.

Para una instalación nueva, el archivo supabase/scripts/crear_tablas_app.sql ya incluye esta optimización. No ejecutes también las migraciones por separado sobre el esquema creado con ese script. El archivo de eliminación también contempla la nueva función.

## Validación registrada

- Lint, TypeScript y build: aprobados.
- 64 pruebas de aplicación y 13 SQL: aprobadas.
- Verificación adicional: script unificado equivalente a las cuatro migraciones en columnas, índices, RLS y permisos de funciones; eliminación y recreación verificadas en PostgreSQL embebido.
- Pruebas específicas: una sola RPC por reporte, bloqueo de usuarios no administradores, paginación y fechas, CSV con límites de filas bajos, selector sin datos extra y ausencia de escrituras en tarjetas al cambiar únicamente notas.

No se ha realizado una prueba autenticada en producción ni medido el ahorro de transferencia, CPU, latencia o consumo del hosting. Las cifras anteriores describen la implementación y las pruebas locales.

## Plan gratuito

[Supabase publica peticiones API ilimitadas en Free](https://supabase.com/pricing). Reducir peticiones no equivale a descontar una cantidad fija de créditos por llamada. Aquí se reduce el trabajo repetido, la transferencia de columnas no utilizadas y las consultas automáticas; el consumo real depende del uso, de la configuración de Auth y de los límites del hosting.
