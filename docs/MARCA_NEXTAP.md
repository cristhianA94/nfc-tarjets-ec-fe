# Identidad visual NexTap

Recursos originales encontrados en D:\Works\NFC\Logo.png y D:\Works\NFC\favicon_io. Los archivos de favicon se copiaron sin modificar su imagen a public/. El logo original se conserva en public/brand/logo-original.png.

## Tokens de interfaz

- Azul marino: #062b50, navegación, contraste y tema del navegador.
- Azul de acciones: #0069b8, botones y enlaces principales.
- Cian: #00aef0, acentos y degradados.
- Verde agua: #00ddb0, acentos de marca.
- Amarillo: #ffbd0a, detalles inspirados en las estrellas.
- Fondo: #f3f7fc.
- Texto: #112f4c.

La paleta de interfaz se definió a partir de los recursos visuales; sus tokens están en src/app/globals.css. Las superficies y estados usan variaciones claras u oscuras para conservar contraste.

La marca compartida está en src/components/brand.tsx. Usa la versión PNG proporcionada de 192 px; el acceso muestra también la versión de 512 px. Estos recursos son locales y no requieren fuentes ni imágenes de servicios externos.

El layout declara el título NexTap, iconos ICO/PNG, Apple touch icon y site.webmanifest. El manifiesto contiene nombre, iconos, colores y ruta inicial. No se implementó un service worker.

La revisión visual cubrió el acceso y la demostración en escritorio y a 390 px de ancho. No se inició una sesión administrativa para revisar las pantallas privadas. Sus estilos comparten los tokens y reglas de navegación, formularios, tablas, reportes y estados.

Se comprobaron las combinaciones principales de texto, botones y estados con contraste superior a 4,5:1. Esto no constituye una auditoría completa de accesibilidad.

Esta modificación de estilo no requiere una migración SQL. Los cambios son locales y deben desplegarse en Netlify para aparecer en producción.