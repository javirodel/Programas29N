# Programas 29N

Web de consulta, búsqueda y comparación sobre los programas electorales oficiales de las elecciones generales del 29 de noviembre (29N), pensada para ir directo al texto literal de cada partido y a la página exacta de su PDF.

No hay cuentas, cookies de seguimiento ni analítica de terceros. El cálculo del test de afinidad se ejecuta por completo en el navegador y el silencio de un partido sobre un tema nunca se interpreta como voto en contra.

## Qué ofrece

- **Portada (`/`)**: hemiciclo interactivo del Congreso saliente (350 escaños) con simulador de mayorías (176 escaños), accesos por bloque y resumen rápido de debates.
- **Programas (`/programas` y `/programas/[partyId]`)**: catálogo completo filtrable por ámbito o provincia y visor por bloques temáticos con enlace directo a la página del PDF original y notas contextuales *«A favor y en contra»* separadas del texto literal.
- **Comparador (`/comparar`)**: comparación directa de hasta 4 candidaturas en los 15 ejes de la encuesta o bloque a bloque.
- **Buscador (`/buscar`)**: búsqueda instantánea en texto completo con `MiniSearch`, tolerante a tildes y variantes léxicas (`es`, `ca`, `gl`).
- **Test de afinidad (`/encuesta`)**: 15 cuestiones sobre políticas públicas con cálculo local en cliente y desglose de coincidencias y citas verificadas.
- **Vocabulario (`/estadisticas`)**: extensión, densidad léxica, términos característicos (TF-IDF) y radar de conceptos clave por partido.
- **Transparencia y buzón (`/metodologia`, `/aviso-legal`, `/privacidad`, `/contacto`, `/api/audit`)**: criterios editoriales, licencias y manifiesto JSON con todos los SHA-256 de los PDFs.

## Cobertura actual del corpus

- **27 programas oficiales en PDF** con hash SHA-256 comprobado y **7.996 propuestas publicadas** (`8.004` extraídas y `8` huecos reservados en el documento del PP).
- **Congreso de los Diputados saliente (350 escaños):** PP, PSOE, VOX, Sumar / Frente Amplio, ERC, Junts, EH Bildu, PNV, Podemos, Compromís, BNG y Coalición Canaria. **UPN** concurre en coalición con el PP en Navarra sin PDF autónomo separado y cuenta con su propia ficha informativa.
- **15 candidaturas extraparlamentarias:** Adelante Andalucía, Drago Canarias, Falange, Frente Obrero, Geroa Bai, Iustitia Europa, PACMA, Partido Autónomos, Partido Humanista, PFAC, Por un Mundo más Justo, SALF, Soria ¡YA!, Teruel Existe y Unidad del Pueblo Canario (UPC).

## Organización del repositorio

El código sigue una arquitectura de monolito modular en **Next.js 16 (App Router)** + **TypeScript estricto**, sin base de datos externa: todos los datos se validan con **Zod** y se compilan a JSON estáticos en build time.

```text
.
├── pdfs_originales/          # N0 · PDFs oficiales inmutables (fuente primaria + SHA-256)
├── procesados/               # N1–N2 · Extracciones Docling (.json/.md/.txt) y desglose por bloques
├── data/                     # N3 · Curación humana en Git (validada con Zod)
│   ├── registry/             #   Metadatos de documentos, URLs oficiales y hashes esperados
│   ├── taxonomy/             #   19 bloques temáticos comunes + otros
│   ├── survey/               #   Banco de 15 preguntas y posturas codificadas por candidatura
│   ├── reviews/              #   Verificaciones manuales y citas cruzadas al PDF
│   └── annotations/          #   Fuentes externas contrastadas para notas contextuales
├── tools/data/               # Pipeline N0–N4 en build time (build-corpus.ts, locate-evidence.ts)
├── scripts/                  # Utilidades de ingesta Docling y auditoría de corpus en Python
├── src/
│   ├── app/                  # Rutas App Router, SSR/SSG y endpoints API (/api/search, /api/audit, /api/contact, /pdfs/*)
│   └── modules/              # Módulos aislados por dominio:
│       ├── catalog/          #   Catálogo y filtros territoriales
│       ├── comparator/       #   Matriz comparativa entre partidos
│       ├── contact/          #   Formulario del buzón ciudadano
│       ├── corpus/           #   Esquemas Zod, carga en memoria y métricas TF-IDF
│       ├── home/             #   Hemiciclo del Congreso y termómetro de debates
│       ├── programs/         #   Visor individual por candidatura
│       ├── search/           #   Motor e interfaz MiniSearch
│       ├── stats/            #   Explorador estadístico y radar de conceptos
│       ├── survey/           #   Calculadora local y vista del test de afinidad
│       └── ui/               #   Design tokens CSS, componentes base y paleta WCAG AA
├── tests/                    # Suite de invariantes, búsqueda, comparador, estadísticas, encuesta y a11y
└── docs/                     # Especificación de arquitectura, auditoría de corpus y registro de decisiones
```

### Flujo de datos (N0 → N4)

1. **N0 (`pdfs_originales/`)**: PDFs oficiales tal como los publican las candidaturas.
2. **N1 (`procesados/*/*.json`)**: salida estructurada de Docling con texto e índices de página.
3. **N2 (`procesados/*/*_detallado.json`)**: medidas individuales encuadradas en la taxonomía común.
4. **N3 (`data/`)**: registro maestro, preguntas de encuesta y revisiones de evidencia.
5. **N4 (`.generated/`)**: artefactos compilados al ejecutar `npm run data:build` (`corpus.v1.json`, `search-index.v1.json`, `survey.v1.json` e informe de cobertura). Esta carpeta se genera en build y no se versiona en Git.

## Puesta en marcha

Requisitos: **Node.js >= 20.9** (recomendado Node 22/24) y **npm**.

```bash
# 1. Instalar dependencias
npm ci

# 2. Compilar y validar el corpus N0–N4 (hashes SHA-256, Zod y citas)
npm run data:build

# 3. Arrancar en desarrollo
npm run dev
```

Si quieres probar el build de producción localmente:

```bash
npm run build
npm start
```

### Variables de entorno (opcionales)

El sitio funciona completo sin variables configuradas. Si despliegas una instancia propia y quieres activar el buzón `/contacto` hacia GitHub Issues, un webhook o Resend, copia [.env.example](.env.example) a `.env.local` y rellena únicamente los canales que necesites.

## Comprobaciones y tests

```bash
npm run format:check   # Formato Prettier
npm run lint           # ESLint + reglas jsx-a11y
npm run typecheck      # TypeScript (tsc --noEmit)
npm test               # Suite completa (tests/**/*.test.ts)
```

Para auditar integridad de hashes, estructura Docling y trazabilidad de citas desde Python:

```bash
python scripts/auditar_corpus.py
```

## Seguridad y licencias

- **Código fuente**: licencia [MIT](LICENSE).
- **Textos oficiales y PDFs**: pertenecen íntegramente a sus respectivas formaciones políticas y se sirven con enlace directo a la fuente original en `/pdfs/[filename].pdf`.
- **Seguridad**: validaciones de origen, límite de tamaño, rate-limiting y escape de Markdown en `/api/contact`, control estricto contra *path traversal* en la entrega de PDFs y cabeceras HTTP defensivas (`CSP`, `HSTS`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `COOP` y `Permissions-Policy`) en [next.config.ts](next.config.ts).
