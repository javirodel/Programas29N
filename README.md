# Programas Electorales 29N — Plataforma Cívica de Consulta, Comparación y Afinidad

Plataforma web cívica neutral, verificable y accesible (WCAG 2.2 AA) para consultar los programas electorales oficiales de las elecciones generales del **29 de noviembre (29N)**, comparar posturas bloque a bloque con trazabilidad al PDF original y realizar un test de afinidad programática 100 % local.

---

## Cobertura actual del corpus

- **18 programas electorales oficiales en PDF** compilados y sellados criptográficamente mediante **SHA-256** (`pdfs_originales/`), con **4.588 medidas literales publicadas** y enlace directo a la página exacta de cada PDF.
- **Seguimiento íntegro del Congreso de los Diputados saliente (350 escaños):** incluye las 8 formaciones con programa publicado (PP, PSOE, VOX, ERC, PNV, Compromís, BNG y Coalición Canaria) y las 5 con documento completo aún pendiente de publicación (Sumar / Frente Amplio, Junts, EH Bildu, Podemos y UPN).
- **10 candidaturas extraparlamentarias** con programa oficial completo (Adelante Andalucía, Falange, Frente Obrero, Iustitia Europa, PACMA, Partido Humanista, Por un Mundo más Justo, SALF, Soria ¡YA! y Teruel Existe).

---

## Funcionalidades principales

- **Inicio (`/`)**: Hemiciclo interactivo del Congreso de los Diputados (350 escaños) con accesos directos por bloque y sección completa de «Otras candidaturas».
- **Comparador (`/comparar`)**: Vista continua estilo comparativa de producto con selectores fijos al hacer scroll, resumen de posturas en los 15 ejes principales y desglose detallado bloque por bloque.
- **Test de afinidad (`/encuesta`)**: Cuestionario cívico de 15 cuestiones calculado íntegramente en el navegador del usuario, sin penalizar el silencio de los partidos (`sin_referencia` / `insuficiente`) y con citas al PDF oficial.
- **Buscador (`/buscar`) y Programas (`/programas`, `/programas/[partyId]`)**: Búsqueda instantánea normalizada con MiniSearch, filtros por candidatura y bloque, desplegable colapsado *«A favor y en contra»* y visor documental.
- **Transparencia, Privacidad y Respaldo (`/metodologia`, `/privacidad`, `/aviso-legal`, `/api/audit`)**: Política de cero rastreo, licencias y manifiesto descargable con todos los hashes SHA-256.

---

## Arquitectura de datos (N0–N4)

1. **N0 (`pdfs_originales/`):** Documentos PDF oficiales inmutables con hash SHA-256 verificado.
2. **N1 (`procesados/*/*.json`):** Extracciones estructuradas Docling con coordenadas de página (solo lectura).
3. **N2 (`procesados/*/*_detallado.json`):** Desglose por bloques temáticos y notas contextuales.
4. **N3 (`data/`):** Registro documental, taxonomía canónica, banco de encuesta y capas de curación validadas con Zod.
5. **N4 (`.generated/`):** Dataset normalizado e índice de búsqueda compilados automáticamente antes de cada build (`npm run data:build`).

---

## Comandos de desarrollo y verificación

```bash
# Instalar dependencias
npm ci

# Compilar el corpus N0–N4 y validar esquemas + SHA-256
npm run data:build

# Comprobaciones de calidad
npm run format:check
npm run lint
npm run typecheck
npm test

# Arrancar en desarrollo o compilar para producción
npm run dev
npm run build && npm start
```

---

## Licencias y seguridad

- **Código fuente:** Distribuido bajo licencia **MIT** ([`LICENSE`](LICENSE)).
- **Programas electorales oficiales:** Los documentos PDF y textos literales pertenecen a sus respectivas candidaturas políticas y se muestran con atribución y enlace directo al original (`/pdfs/[filename].pdf`).
- **Privacidad y seguridad:** Sin cookies ni analítica de terceros; cálculo del test 100 % local en el navegador; cabeceras HTTP estrictas (`Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Cross-Origin-Opener-Policy: same-origin` y `Permissions-Policy`) en [`next.config.ts`](next.config.ts).
