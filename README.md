# Validación de identidad — Descarga de certificado

Página pública de una sola vista para consultar un registro por número de
documento y descargar el certificado de validación en PDF o imprimirlo.

Es un proyecto independiente del backoffice: **solo lectura**, sin login, sin
subida de archivos y sin escrituras en la base de datos.

## Requisitos

- Node.js 20+
- Acceso a la misma base PostgreSQL/Supabase del backoffice

## Puesta en marcha

```bash
npm install
cp .env.example .env   # completa las credenciales
npm run dev
```

La app queda en `http://localhost:3000`.

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | URL con pooler (puerto 6543) que usa Prisma en runtime. |
| `DIRECT_URL` | URL directa (puerto 5432). Prisma la usa en el schema. |
| `ALLOWED_CEDULAS` | Cédulas habilitadas separadas por coma. Si se omite o queda vacía, se permite cualquier documento. |

### Comportamiento de la consulta

- `ALLOWED_CEDULAS=71242042` → solo esa cédula pasa el filtro.
- Cualquier otra cédula devuelve el mensaje de **créditos de IA agotados**.
- Si `ALLOWED_CEDULAS` no existe o está vacía, se consulta cualquier documento.

No hay datos de demostración: el certificado **solo** se genera cuando la fila
existe en `registros` y tiene `verificado = true`. Si no existe, la página
responde **no encontrado**.

## Cómo funciona

1. El usuario ingresa la cédula en `POST /api/verificar`.
2. El servidor normaliza el documento, revisa la lista permitida y consulta
   `registros` en la base de datos.
3. Mientras responde, se muestra una barra de progreso de ~3 segundos con
   tres pasos: *Revisando datos*, *Verificando en el sistema* y
   *Generando documento*. La duración se ajusta en
   `src/components/progreso.tsx` (`DURACION_PROGRESO_MS`).
4. Estados posibles:
   - `verificado` → devuelve los datos básicos y el certificado.
   - `no_verificado` → el registro existe pero `verificado = false`.
   - `no_encontrado` → no hay registro para ese documento.
   - `sin_creditos` → la cédula no está en `ALLOWED_CEDULAS`.
5. El certificado se descarga desde `GET /api/certificado/pdf?cedula=...`, que
   vuelve a validar todo en el servidor y genera un PDF A4 con `pdf-lib`.
6. Al descargar o imprimir aparece un sello de validación animado; el
   certificado también lleva un sello impreso en la esquina inferior.
7. El botón **Imprimir** usa `window.print()` y una hoja de estilos que oculta
   todo excepto el certificado (incluido el sello).
8. El botón **Nueva consulta** limpia el formulario y devuelve al inicio sin
   recargar la página.

### Tipografía

La interfaz usa **Roboto** en todos sus pesos (`next/font/google`). El PDF
generado también incrusta Roboto Regular y Bold desde `public/fonts` (licencia
Apache 2.0 en `public/fonts/LICENSE.txt`). Si esos archivos no están
disponibles, el PDF cae automáticamente a Helvetica para no romper la descarga.

### Datos que se muestran

Nombre completo, documento, fecha de nacimiento, teléfono, Telegram, ubicación,
fecha de registro y cantidad de imágenes subidas.

No se exponen correo, dirección exacta, datos bancarios, URLs de imágenes ni
observaciones administrativas.

## Seguridad

- La lista de cédulas se valida en el servidor, nunca en el navegador.
- Consultas limitadas a 30 por minuto por IP (en memoria, suficiente para una
  instancia; para varias instancias usar un almacén compartido).
- `noindex` para que la página no sea indexada.
- Sin endpoints de escritura.

## Scripts

```bash
npm run dev       # desarrollo
npm run build     # prisma generate + build de producción
npm run start     # producción
npm run db:check -- 49774099   # comprueba un registro en la base
```

## Despliegue

Funciona en cualquier entorno Node (Vercel, Railway, VPS). La base se consulta
con Prisma en runtime. Si se despliega en Cloudflare Workers/Pages hay que añadir
el adaptador de Prisma para ese entorno, que este proyecto no incluye.
