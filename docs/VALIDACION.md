# Validación de la entrega

Fecha: 15 de noviembre de 2026.

## Resultados observados

- Frontend: npm run lint sin errores ni advertencias.
- Frontend: npm run typecheck con generación previa de tipos de rutas.
- Frontend: npm test, 60 pruebas aprobadas en 6 archivos.
- Frontend: npm run build, compilación Next.js de producción completada.
- Backend: npm test, 5 pruebas de integración SQL aprobadas.
- npm audit --omit=dev: 0 vulnerabilidades reportadas en dependencias de producción en esta ejecución.
- package.json y package-lock.json coherentes en ambos repositorios. Las versiones directas están fijadas.
- Archivos .gitlab-ci.yml incluidos para ejecutar las verificaciones en GitLab. La CI remota todavía no se ha ejecutado.
- Cambios guardados localmente en los repositorios existentes. No se ha realizado commit, push ni despliegue.

## Qué cubren las pruebas

Frontend: login válido/inválido con Supabase simulado, autorización administrativa, cierre de sesión, rechazo de escrituras de otro origen, creación con reintento de colisión, edición, activación, suspensión, eliminación, inmutabilidad del código, HTTP 302, destino actualizado sin cambiar la URL, tarjetas disponibles/suspendidas/inexistentes, error de base de datos, lista de destinos permitidos, fechas, reportes y exportación CSV paginada.

Backend: ejecución de la migración SQL real sobre PostgreSQL embebido mediante PGlite. Se recrea el contrato auth.uid() y los roles anónimo/autenticado de Supabase para comprobar RLS y privilegios. Incluye 500 inserciones con códigos distintos, restricción UNIQUE, condiciones de activación, ciclo de estados, eliminación, marcas de tiempo e inmutabilidad.

## Comprobaciones HTTP locales

Sobre next start, con las credenciales todavía sin configurar:

| Ruta | Respuesta observada |
| --- | --- |
| /demo | HTTP 200 |
| /no-disponible | HTTP 200 |
| /admin/login | HTTP 200, instrucciones de configuración |
| /admin/tarjetas | HTTP 200, instrucciones de configuración |
| /admin/tarjetas/nueva | HTTP 200, instrucciones de configuración |
| /admin/tarjetas/K7P4X9 | HTTP 200, instrucciones de configuración |
| /admin/reportes | HTTP 200, instrucciones de configuración |
| /r/bad | HTTP 404 y Cache-Control no-store |
| /r/K7P4X9 | HTTP 503 y Cache-Control no-store, sin Supabase configurado |
| /ruta-inexistente | HTTP 404 |

## Límites de verificación

No se ha conectado esta entrega a un proyecto Supabase real: no se suministraron credenciales. El login real, renovación de sesión con el servicio alojado y operaciones desde un navegador quedan pendientes de esa configuración. Las pruebas de Auth/handlers usan clientes simulados; las pruebas SQL sí ejecutan PostgreSQL embebido.

La herramienta de navegador no pudo inicializarse: devolvió "failed to write kernel assets" y "El sistema no puede encontrar la ruta especificada". No hay capturas ni revisión visual realizada. La aplicación incluye CSS responsive, pero su apariencia visual no se ha verificado en un navegador.

No se han probado etiquetas NFC físicas ni teléfonos reales. Tampoco se ha efectuado un despliegue a Vercel, configuración DNS ni migración en Supabase alojado.

El servidor usado para las comprobaciones se detiene al cerrar la entrega. Para trabajar localmente sigue el README del frontend y ejecuta npm run dev.

## Pasos externos necesarios

1. Crear/configurar Supabase, desactivar el registro público y aplicar la migración.
2. Crear manualmente el primer administrador e insertar su UUID en admin_users.
3. Completar .env.local del frontend o las variables de Vercel.
4. Comprobar el flujo completo con una tarjeta de prueba y el enlace real del negocio.
5. Elegir y configurar el dominio definitivo antes de grabar las etiquetas.
