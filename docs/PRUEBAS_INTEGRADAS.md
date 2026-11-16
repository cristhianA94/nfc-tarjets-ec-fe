# Pruebas integradas, 15 de noviembre de 2026

Repositorio único: D:\Works\NFC\frontend\nfc-tarjets-ec-fe.

- npm run lint: aprobado.
- npm run typecheck: aprobado.
- npm test: 60 pruebas de unidad y handlers, más 5 pruebas SQL, todas aprobadas.
- npm run build: aprobado.

Las pruebas SQL están en tests/database.test.mjs y ejecutan supabase/migrations/202611150001_nfc.sql en PostgreSQL embebido PGlite. Incluyen RLS, privilegios, ciclo completo de tarjeta, inmutabilidad, timestamps, validación de destinos y 500 códigos únicos. No modifican Supabase alojado.

npm test incluye ambas suites y la CI existente ejecuta ese comando. npm run test:db permite ejecutar solo las pruebas SQL.

El login válido y el CRUD mediante una sesión real de administrador en Supabase alojado siguen pendientes de verificación.