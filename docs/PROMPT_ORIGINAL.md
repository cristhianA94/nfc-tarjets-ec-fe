# Proyecto: Sistema web de administración de tarjetas NFC para reseñas de Google

Actúa como un ingeniero de software senior especializado en Next.js, TypeScript, Supabase, autenticación, seguridad y desarrollo de aplicaciones web ligeras.

Desarrolla una aplicación web completa, sencilla, responsive y preparada para producción, destinada a administrar tarjetas físicas NFC que comercializaré presencialmente a negocios locales.

## 1. Contexto del negocio

Voy a fabricar soportes físicos de acrílico o PVC para que los clientes de diferentes negocios puedan dejar reseñas en Google.

Cada soporte tendrá:

- Una etiqueta NFC NTAG213.
- Un espacio reservado para colocar una pegatina con un código QR.
- Un diseño físico que invite a dejar una reseña en Google.

**IMPORTANTE: el QR no será gestionado por esta aplicación.**

Cuando venda una tarjeta:

1. Configuraré desde mi aplicación el NFC para que redirija al enlace de Google Reviews del negocio.
2. Generaré manualmente un QR con el enlace directo de Google Reviews mediante https://www.qrcode-monkey.com/es/.
3. Mandaré a imprimir ese QR en papel adhesivo.
4. Pegaré el QR en el espacio reservado de la tarjeta física.

El código QR será independiente del sistema de redirecciones NFC.

Por lo tanto, no desarrollar ninguna funcionalidad de generación, descarga, impresión, almacenamiento o administración de códigos QR.

## 2. Objetivo de la aplicación

Necesito únicamente:

- Autenticación de administrador.
- CRUD sencillo de tarjetas NFC.
- Gestión de enlaces de Google Reviews.
- Redirecciones dinámicas.
- Activación rápida de tarjetas.
- Reportes básicos.

No quiero un CRM, ERP ni una plataforma SaaS compleja.

No implementar pagos, suscripciones, facturación, gestión de clientes, inventario avanzado ni módulos innecesarios.

## 3. Stack tecnológico

Utilizar:

- Next.js con App Router.
- TypeScript.
- Tailwind CSS.
- Supabase PostgreSQL.
- Supabase Auth.
- Supabase SSR para gestionar sesiones mediante cookies.
- Route Handlers de Next.js.
- Despliegue compatible con Vercel.

Mantener una arquitectura sencilla, modular y económica.

## 4. Identificación de tarjetas NFC

Cada tarjeta debe tener un identificador público único generado automáticamente.

Ejemplo:

`K7P4X9`

Cada identificador tendrá una URL permanente:

`https://midominio.com/r/K7P4X9`

Esta URL será programada manualmente en la etiqueta NFC mediante la aplicación NFC Tools.

El dominio todavía no está definido.

Utilizar una variable de entorno:

`NEXT_PUBLIC_APP_URL`

Generar códigos públicos aleatorios y únicos, evitando identificadores secuenciales.

El identificador público no debe modificarse después de crear una tarjeta.

Mostrar en el panel administrativo:

- Código de tarjeta.
- URL permanente.
- Botón para copiar la URL.

No es necesario leer ni almacenar el UID físico del chip NFC.

No implementar escritura NFC desde el navegador.

## 5. Redirecciones NFC

Implementar una ruta pública:

`GET /r/[codigo]`

Esta ruta no requiere autenticación.

Cuando una persona acerque su celular al NFC, el teléfono abrirá la URL programada y el backend consultará el estado de la tarjeta.

### DISPONIBLE

La tarjeta todavía no está asignada a ningún negocio.

Mostrar una página de demostración con:

- Título: "Consigue más reseñas en Google".
- Explicación breve del producto.
- Beneficios de utilizar NFC.
- Diseño sencillo y adaptable a móviles.

### ACTIVA

La tarjeta está asociada a un negocio.

Redirigir automáticamente mediante HTTP 302 al enlace de Google Reviews configurado.

Ejemplo:

URL NFC:

`https://midominio.com/r/K7P4X9`

URL de destino:

`https://g.page/r/EJEMPLO/review`

La redirección debe realizarse desde el servidor, sin botones ni páginas intermedias.

Configurar las cabeceras de caché para permitir actualizar el destino posteriormente.

### SUSPENDIDA

Mostrar una página informando que la tarjeta no está disponible temporalmente.

### Código inexistente

Responder con HTTP 404.

## 6. Autenticación del administrador

Utilizar Supabase Auth.

### Inicio de sesión

Crear:

`/admin/login`

Utilizar credenciales:

- Correo electrónico.
- Contraseña.

No permitir registro público.

Inicialmente existirá un único administrador creado manualmente desde Supabase.

Documentar cómo crear el usuario inicial.

### Sesiones y tokens

Utilizar el SDK oficial de Supabase y Supabase SSR.

Implementar:

- Access tokens y refresh tokens administrados por Supabase Auth.
- Sesiones mediante cookies.
- Renovación de sesión.
- Verificación de identidad desde el servidor.
- Validación de autorización en cada operación privada.
- Cierre de sesión.
- Redirección al login cuando la sesión no sea válida.

No implementar JWT personalizados.

No almacenar tokens manualmente en localStorage.

No confiar únicamente en la protección de rutas del frontend.

### Autorización

Crear una tabla `admin_users` vinculada a Supabase Auth.

Solo los usuarios registrados explícitamente como administradores podrán acceder al sistema.

Verificar autenticación y autorización en todas las operaciones administrativas.

Aplicar Row Level Security en Supabase.

No exponer claves privadas en el frontend.

## 7. Panel administrativo

Crear un panel sencillo, responsive y optimizado para móviles.

Menú principal:

1. Tarjetas
2. Reportes
3. Cerrar sesión

No crear un dashboard adicional.

Al iniciar sesión, redirigir directamente a `/admin/tarjetas`.

## 8. CRUD de tarjetas

### Listado

Mostrar:

- Código de tarjeta.
- Nombre del negocio.
- Estado.
- Fecha de creación.
- Fecha de activación.
- Acciones.

Incluir búsqueda por código o nombre del negocio.

Agregar filtros por estado y paginación sencilla si es necesario.

### Crear tarjeta

Campos:

- Código público generado automáticamente.
- Nombre del negocio (opcional).
- URL de Google Reviews (opcional).
- Estado inicial: DISPONIBLE.
- Observaciones (opcional).

Al guardar, generar automáticamente la URL permanente del NFC.

Mostrar un botón para copiar esa URL y programarla mediante NFC Tools.

### Editar tarjeta

Permitir:

- Asignar o modificar el nombre del negocio.
- Asignar o modificar el enlace de Google Reviews.
- Modificar observaciones.
- Cambiar el estado.
- Consultar y copiar la URL NFC.
- Consultar fechas de creación y activación.

El código público debe ser inmutable.

### Activar tarjeta

Para activar una tarjeta disponible, solicitar:

- Nombre del negocio.
- Enlace directo de Google Reviews.

Validar ambos campos.

Al guardar:

- Actualizar los datos.
- Cambiar el estado a ACTIVA.
- Registrar la fecha de activación.
- Mostrar confirmación.
- Incluir botón para probar la URL NFC.

### Suspender tarjeta

Permitir cambiar una tarjeta activa a SUSPENDIDA.

Una tarjeta suspendida no debe redirigir a Google Reviews.

Permitir reactivarla conservando los datos anteriores, previa validación del enlace.

### Eliminar tarjeta

Permitir eliminar tarjetas con confirmación.

Advertir que eliminar una tarjeta ya programada puede inutilizar su NFC.

Preferir la suspensión cuando una tarjeta ya fue vendida.

## 9. Activación rápida desde el celular

Este flujo es prioritario.

Quiero poder vender una tarjeta y activarla inmediatamente desde mi teléfono.

Dentro de la sección Tarjetas:

1. Buscar una tarjeta mediante su código.
2. Abrir su formulario de edición.
3. Introducir el nombre del negocio.
4. Introducir su enlace de Google Reviews.
5. Guardar y activar.
6. Probar el NFC.

Como mejora opcional, permitir introducir directamente el código desde una URL administrativa.

Ejemplo:

`/admin/tarjetas/K7P4X9`

No es necesario implementar lectura NFC nativa, escaneo de QR ni acceso a la cámara.

## 10. Base de datos

Utilizar Supabase PostgreSQL.

### Tabla cards

Campos:

- `id`: UUID, clave primaria.
- `public_code`: VARCHAR, único.
- `business_name`: VARCHAR, nullable.
- `google_review_url`: TEXT, nullable.
- `status`: AVAILABLE, ACTIVE, SUSPENDED.
- `notes`: TEXT, nullable.
- `created_at`: TIMESTAMP.
- `activated_at`: TIMESTAMP, nullable.
- `updated_at`: TIMESTAMP.

### Tabla admin_users

Campos:

- `user_id`: UUID, vinculado a Supabase Auth.
- `created_at`: TIMESTAMP.

Crear índices, restricciones, migraciones SQL y políticas RLS.

Evitar tablas innecesarias.

## 11. Menú Reportes

Crear una página:

`/admin/reportes`

Mostrar:

- Total de tarjetas registradas.
- Tarjetas disponibles.
- Tarjetas activas.
- Tarjetas suspendidas.
- Tarjetas activadas durante un periodo seleccionado.

Incluir filtro por rango de fechas.

Mostrar un listado de activaciones con:

- Código de tarjeta.
- Nombre del negocio.
- Fecha de activación.
- Estado actual.

Permitir exportar los datos a CSV.

No implementar analítica de escaneos, seguimiento de visitantes, geolocalización ni gráficos complejos.

## 12. Validaciones y seguridad

Implementar:

- Validación de URLs HTTPS.
- Lista de dominios de Google permitidos.
- Protección contra redirecciones abiertas.
- Autenticación y autorización del administrador.
- Políticas RLS.
- Validación de formularios.
- Manejo adecuado de errores.
- Protección de operaciones de creación, edición y eliminación.
- Variables de entorno para credenciales.
- No exposición de claves privadas.
- No almacenamiento de datos personales de quienes escanean el NFC.

Validar correctamente los enlaces de Google Reviews y evitar URLs externas arbitrarias.

No realizar solicitudes HTTP a destinos arbitrarios introducidos por usuarios.

## 13. Diseño UI/UX

Quiero una aplicación sencilla y profesional.

Características:

- Mobile-first.
- Responsive.
- Minimalista.
- Formularios cómodos.
- Botones claros.
- Indicadores de estado.
- Notificaciones de éxito y error.
- Confirmaciones para acciones destructivas.
- Interfaz completamente en español.

No crear interfaces sobrecargadas ni componentes innecesarios.

## 14. Rutas

### Públicas

- `/r/[codigo]`: redirección NFC.
- `/demo`: demostración.
- `/no-disponible`: tarjeta suspendida.

### Administrativas

- `/admin/login`: autenticación.
- `/admin/tarjetas`: listado.
- `/admin/tarjetas/nueva`: creación.
- `/admin/tarjetas/[codigo]`: edición.
- `/admin/reportes`: reportes.

## 15. Pruebas

Implementar pruebas para:

- Login válido e inválido.
- Acceso no autorizado.
- Creación de tarjetas.
- Unicidad de identificadores.
- Edición.
- Activación.
- Suspensión.
- Eliminación.
- Redirección HTTP 302.
- Tarjetas disponibles.
- Tarjetas inexistentes.
- Validación de enlaces de Google.
- Reportes básicos.

Comprobar que modificar el enlace de Google Reviews no cambia la URL NFC permanente.

## 16. Configuración y despliegue

Preparar el proyecto para utilizar:

- Vercel para hosting.
- Supabase para autenticación y base de datos.

Crear:

- README en español.
- `.env.example`.
- Migraciones SQL.
- Instrucciones para configurar Supabase.
- Instrucciones para crear el administrador inicial.
- Instrucciones para ejecutar localmente.
- Instrucciones para desplegar en Vercel.
- Instrucciones para configurar el dominio definitivo.
- Guía breve para programar el NFC mediante NFC Tools.

La URL base debe quedar configurable mediante variables de entorno.

Advertir que el dominio definitivo debe elegirse antes de programar las etiquetas NFC.

## 17. Flujo final esperado

### Preparación

1. Inicio sesión en la aplicación.
2. Creo una tarjeta.
3. El sistema genera su código y URL NFC.
4. Copio la URL.
5. Programo el chip NFC mediante NFC Tools.
6. Coloco el NFC en el soporte físico.
7. Dejo libre el espacio reservado para el QR.

### Venta presencial

1. Visito un negocio con la tarjeta.
2. Le muestro cómo funciona el NFC.
3. El dueño acepta comprarla.
4. Accedo a mi aplicación desde el celular.
5. Busco la tarjeta mediante su código.
6. Introduzco el nombre del negocio.
7. Introduzco el enlace de Google Reviews.
8. Activo la tarjeta.
9. Compruebo que el NFC redirige correctamente.
10. Genero manualmente un QR con el enlace directo de Google Reviews.
11. Mando a imprimir el QR en papel adhesivo.
12. Pego el QR en el espacio reservado de la tarjeta.

### Resultado

El NFC redirige mediante mi aplicación y permite cambiar el destino posteriormente.

El QR dirige directamente a Google Reviews y no depende de mi aplicación.

## 18. Instrucciones de implementación

1. Inspecciona el repositorio antes de modificarlo.
2. Si está vacío, inicializa el proyecto.
3. Define una arquitectura sencilla.
4. Implementa el MVP completo.
5. No te limites a pseudocódigo.
6. Crea todos los archivos necesarios.
7. Mantén el código modular y fácil de mantener.
8. No agregues funcionalidades no solicitadas.
9. Ejecuta lint, typecheck, build y pruebas cuando sea posible.
10. Corrige los errores encontrados.
11. Documenta las configuraciones externas necesarias.
12. No inventes credenciales ni secretos.

**Objetivo final:** desarrollar una aplicación web ligera y segura que permita administrar tarjetas NFC, asignarlas a negocios, modificar sus enlaces de Google Reviews, activar o suspender tarjetas y consultar reportes básicos. Los códigos QR se generarán e imprimirán manualmente y quedan completamente fuera del alcance del software.