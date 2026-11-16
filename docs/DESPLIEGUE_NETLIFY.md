# Desplegar en Netlify Free

La configuración netlify.toml usa npm run build y .next. Netlify detecta Next.js y aplica su adaptador OpenNext. La aplicación usa servidor, sesiones y Route Handlers: no publicar como exportación estática ni arrastrar únicamente archivos HTML.

1. Crear o iniciar sesión en https://app.netlify.com/ con el plan Free.
2. Importar el repositorio GitHub nfc-tarjets-ec-fe. El código local debe estar subido antes de importar: actualmente Git solo tiene README.md versionado.
3. Usar la raíz del repositorio, Node 22, build npm run build y directorio .next.
4. Elegir el nombre final del sitio para obtener https://NOMBRE.netlify.app.
5. Configurar en Netlify, para builds y funciones de producción:
   - NEXT_PUBLIC_APP_URL=https://NOMBRE.netlify.app
   - NEXT_PUBLIC_SUPABASE_URL: el valor local de .env.local.
   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: el valor local de .env.local.
6. Desplegar nuevamente después de cambiar estas variables: las variables NEXT_PUBLIC se incluyen durante la compilación.
7. En Supabase > Authentication > URL Configuration establecer Site URL al mismo origen HTTPS. Conservar deshabilitado el registro público.
8. Comprobar login, creación de una tarjeta, activación, redirección 302, suspensión y reportes con CSV.

No subir .env.local al repositorio ni pegar credenciales administrativas en el chat. No hace falta service_role.

El subdominio netlify.app permite comenzar sin comprar un dominio. Elegir la URL permanente antes de programar etiquetas NFC y conservarla mientras se usen esas etiquetas.

El plan Free tiene límites de uso; consultar https://www.netlify.com/pricing/ antes de operar. La publicación y configuración DNS todavía no están verificadas hasta que exista una URL desplegada.

Referencias:
- https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/
- https://www.netlify.com/blog/introducing-netlify-free-plan/