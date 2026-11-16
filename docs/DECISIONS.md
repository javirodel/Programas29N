# DECISIONS — Registro de Decisiones de Arquitectura (ADR)

Este documento recoge las decisiones arquitectónicas y técnicas clave adoptadas para el proyecto 29N, motivadas por la auditoría documental y funcional realizada en la Fase 0.

---

## Índice de Decisiones

- [D-001: Monolito modular basado en Next.js (App Router), React y TypeScript](#d-001-monolito-modular-basado-en-nextjs-app-router-react-y-typescript)
- [D-002: Base de datos estática compilada (.generated) para MVP sin base de datos relacional obligatoria en runtime](#d-002-base-de-datos-estática-compilada-generated-para-mvp-sin-base-de-datos-relacional-obligatoria-en-runtime)
- [D-003: Inmutabilidad estricta y desacoplamiento del corpus existente (N0, N1, N2)](#d-003-inmutabilidad-estricta-y-desacoplamiento-del-corpus-existente-n0-n1-n2)
- [D-004: Jerarquía de datos en 5 niveles (N0–N4) y modelo de capas](#d-004-jerarquía-de-datos-en-5-niveles-n0n4-y-modelo-de-capas)
- [D-005: Normalización de identificadores URL-safe (kebab-case) preservando legacy_id](#d-005-normalización-de-identificadores-url-safe-kebab-case-preservando-legacy_id)
- [D-006: Tratamiento de análisis IA no verificados en la vista pública](#d-006-tratamiento-de-análisis-ia-no-verificados-en-la-vista-pública)
- [D-007: Modelo unificado de estados de revisión (ReviewStatus)](#d-007-modelo-unificado-de-estados-de-revisión-reviewstatus)
- [D-008: Tratamiento de medidas reservadas de campaña como kind: reservada](#d-008-tratamiento-de-medidas-reservadas-de-campaña-como-kind-reservada)
- [D-009: Taxonomía canónica de 19 bloques temáticos comunes + bloque abierto](#d-009-taxonomía-canónica-de-19-bloques-temáticos-comunes--bloque-abierto)
- [D-010: Motor de búsqueda en memoria indexado en build (MiniSearch) para MVP](#d-010-motor-de-búsqueda-en-memoria-indexado-en-build-minisearch-para-mvp)
- [D-011: Lógica del comparador multipartido: bloques comunes sin inferencias](#d-011-lógica-del-comparador-multipartido-bloques-comunes-sin-inferencias)
- [D-012: Algoritmo de encuesta local-first con distinción de posición vs silencio](#d-012-algoritmo-de-encuesta-local-first-con-distinción-de-posición-vs-silencio)
- [D-013: Localizador de evidencias automático mediante alineación Docling](#d-013-localizador-de-evidencias-automático-mediante-alineación-docling)
- [D-014: Sistema de diseño mediante Tailwind CSS, CSS Custom Properties y WCAG 2.2 AA](#d-014-sistema-de-diseño-mediante-tailwind-css-css-custom-properties-y-wcag-22-aa)
- [D-015: Cuarentena y remediación para Partido Humanista y SALF](#d-015-cuarentena-y-remediación-para-partido-humanista-y-salf)
- [D-016: Metadatos no acreditados envueltos en Verifiable<T>](#d-016-metadatos-no-acreditados-envueltos-en-verifiablet)
- [D-017: Esquemas Zod como única fuente de verdad tipada](#d-017-esquemas-zod-como-única-fuente-de-verdad-tipada)
- [D-018: Preservación de la lengua oficial original de las propuestas](#d-018-preservación-de-la-lengua-oficial-original-de-las-propuestas)
- [D-019: Entrega en streaming y solo lectura de PDFs originales mediante Route Handler con HTTP Range](#d-019-entrega-en-streaming-y-solo-lectura-de-pdfs-originales-mediante-route-handler-con-http-range)

---

### D-001: Monolito modular basado en Next.js (App Router), React y TypeScript

- **Estado:** Aceptada
- **Contexto:** `promt.md` barajaba múltiples alternativas tecnológicas abiertas (Next.js vs Remix, Express/Koa vs FastAPI, Supabase vs PostgreSQL gestionado vs Microservicios). Se requería una decisión única, pragmática y mantenible.
- **Decisión:** Implementar la aplicación completa como un **monolito modular** en Next.js (App Router), React 19 y TypeScript estricto. La aplicación incluirá tanto las rutas web públicas como las rutas API internas necesarias para utilidades o exportaciones.
- **Consecuencias:**
  - Positivas: Simplifica el despliegue (Node.js estándar o edge runtime tipo Vercel/Netlify/Docker), elimina la sobrecarga de gestionar backends independientes y sincronizar modelos de datos duplicados.
  - Negativas: Requiere mantener una separación estricta de módulos dentro de `/src` para evitar acoplamientos.

---

### D-002: Base de datos estática compilada (.generated) para MVP sin base de datos relacional obligatoria en runtime

- **Estado:** Aceptada
- **Contexto:** El corpus 29N consta de 9 programas electorales y 1.652 medidas ya fijadas para una convocatoria electoral concreta (datos cerrados de lectura intensiva). `promt.md` sugería instalar PostgreSQL/Supabase, pgvector y servidores de base de datos.
- **Decisión:** Para el alcance MVP, **no se requiere una base de datos relacional externa en producción**. La ingesta procesa y valida los archivos de datos en tiempo de compilación (`build time`), produciendo artefactos JSON inmutables en `.generated/` (`corpus.v1.json`, `search-index.v1.json`, `survey.v1.json`). Next.js consume estos artefactos mediante SSG/ISR y módulos de lectura en servidor.
- **Consecuencias:**
  - Positivas: Coste de infraestructura $0 o mínimo, disponibilidad del 100%, latencias de lectura ultra-rápidas, sin superficie de ataque de SQL Injection, sin migraciones de base de datos en servidores de producción.
  - Negativas: Los cambios en datos requieren re-compilación/re-despliegue del sitio (proceso que toma < 30 segundos). La futura fase editorial multiusuario (roadmap) requerirá añadir persistencia dinámica.

---

### D-003: Inmutabilidad estricta y desacoplamiento del corpus existente (N0, N1, N2)

- **Estado:** Aceptada
- **Contexto:** El repositorio contiene carpetas de fuentes primarias (`pdfs_originales/`), conversiones Docling (`procesados/`) y análisis previos de IA. Correr scripts de reprocesamiento o modificar estos archivos destruiría el trabajo previo y alteraría hashes ya verificados.
- **Decisión:** Las carpetas `pdfs_originales/` y `procesados/` se declaran **estrictamente de solo lectura**. Ningún script de ingesta ni la aplicación escribirán o modificarán jamás estos directorios.
- **Consecuencias:**
  - Positivas: Trazabilidad forense garantizada, integridad de hashes SHA-256 intacta.
  - Negativas: Si un texto extraído por Docling tiene una errata o salto de línea anómalo, la corrección debe aplicarse mediante una capa de overlay en `data/reviews/`, sin editar el archivo original.

---

### D-004: Jerarquía de datos en 5 niveles (N0–N4) y modelo de capas

- **Estado:** Aceptada
- **Contexto:** Existe riesgo de confundir texto literal de un partido con resúmenes elaborados por IA o correcciones manuales.
- **Decisión:** Establecer una jerarquía estricta:
  - **N0:** PDF original (inmutable).
  - **N1:** Artefactos Docling (`.md`, `.json`, `.txt`, `metadata.json`).
  - **N2:** Análisis derivados por IA (`*_medidas_detallado.json`).
  - **N3:** Curación humana y configuración editorial (`data/`).
  - **N4:** Dataset normalizado de entrega (`.generated/`).
- **Consecuencias:** Reglas de precedencia matemáticas donde N3 > N2 > N1 > N0 en cuanto a correcciones editoriales, pero donde la evidencia siempre debe rastrearse hasta N1 y N0.

---

### D-005: Normalización de identificadores URL-safe (kebab-case) preservando legacy_id

- **Estado:** Aceptada
- **Contexto:** Los identificadores heredados usan formatos no aptos para URLs (`M+J-001`, `EAJ-PNV-205`, `CCa-022`).
- **Decisión:** Cada entidad tendrá un identificador primario normalizado en kebab-case seguro para rutas web (ej. `por-un-mundo-mas-justo-001`, `eaj-pnv-205`, `partido-popular-144`), manteniendo el campo `legacy_id` para trazabilidad hacia los archivos `*_detallado.json`.
- **Consecuencias:** Rutas amigables tipo `/programas/partido-popular/propuestas/partido-popular-144` sin codificación de caracteres especiales en URL.

---

### D-006: Tratamiento de análisis IA no verificados en la vista pública

- **Estado:** Enmendada (v1.2 · 2026-11-13)
- **Contexto:** Los archivos detallados contienen los campos `explicacion_medida`, `datos_a_favor` y `datos_en_contra`. Repetir banners técnicos de "análisis generado por IA pendiente de verificación humana" dentro de cada una de las 2.689 tarjetas ensuciaba la lectura. El usuario solicitó mantener las vistas de consulta limpias y concentrar las notas sobre origen, auditoría y generación en `/metodologia`.
- **Decisión:** Exponer `ai_annotations` (`summary`, `arguments_for`, `arguments_against`) en un desplegable colapsado por defecto (**«A favor y en contra»**) visualmente separado del texto literal oficial del partido y de su enlace al PDF, manteniendo toda la explicación técnica sobre su naturaleza contextual y su auditoría en la página dedicada [`/metodologia`](/metodologia).
- **Consecuencias:** Lectura ciudadana limpia y escaneable sin renunciar a la transparencia completa sobre el origen de cada capa de datos en la sección de metodología.

---

### D-007: Modelo unificado de estados de revisión (ReviewStatus)

- **Estado:** Aceptada
- **Contexto:** `promt.md` mezclaba términos como "pendiente", "extraída", "revisada", "aprobada", "rechazada", "corregida" sin un ciclo de vida definido.
- **Decisión:** Adoptar un ciclo de vida con 5 estados formales:
  1. `extraida`: generada por el pipeline, coincidencia de evidencia fiable, pendiente de revisión humana.
  2. `requiere_revision`: discrepancia detectada (coincidencia parcial/no localizada, texto sospechoso de paráfrasis). Bloqueada para publicación.
  3. `verificada`: confirmada íntegramente por un revisor humano contra el PDF.
  4. `corregida`: revisada y ajustada mediante overlay en N3.
  5. `rechazada`: descartada formalmente (no es medida, duplicada o reservada).
- **Consecuencias:** Claridad absoluta en los criterios de publicación y en las métricas de cobertura.

---

### D-008: Tratamiento de medidas reservadas de campaña como kind: reservada

- **Estado:** Aceptada
- **Contexto:** El PP incluyó 8 entradas numeradas en su programa con el texto *"Permanezca atento a la campaña para conocer esta nueva medida"*.
- **Decisión:** Tipificar estas entradas con `kind: "reservada"` y asignarles estado `rechazada` para el catálogo de propuestas y el comparador. Se contabilizan en la ficha informativa del programa como *"8 medidas reservadas de campaña"* para no falsear el cómputo total de 249 casillas, pero no se indexan como propuestas activas.
- **Consecuencias:** Evita que aparezcan como propuestas vacías o engañosas en el buscador y el comparador.

---

### D-009: Taxonomía canónica de 19 bloques temáticos comunes + bloque abierto

- **Estado:** Aceptada
- **Contexto:** Los nueve archivos detallados coinciden unánimemente en 19 bloques temáticos canónicos (`bloque_01` a `bloque_19`). Por Un Mundo Más Justo incluye un bloque 20 adicional ("Protección y Bienestar Animal").
- **Decisión:** Adoptar los 19 bloques canónicos normalizados (`vivienda`, `economia`, `fiscalidad`, etc.) y crear una categoría extensible `otros` con identificador temático específico para albergar bloques no compartidos.
- **Consecuencias:** Garantiza que el comparador multipartido y la encuesta cuenten con un marco de referencia transversal homogéneo.

---

### D-010: Motor de búsqueda en memoria indexado en build (MiniSearch) para MVP

- **Estado:** Aceptada
- **Contexto:** Para buscar en 1.652 medidas con filtros combinados (partido, tema, texto), no se justifica desplegar Elasticsearch ni extensiones complejas de Postgres en el MVP.
- **Decisión:** Emplear una biblioteca de búsqueda en memoria probada como `minisearch` o `flexsearch`, generando el índice pre-computado en `build time` (`search-index.v1.json`). La búsqueda se ejecuta de manera instantánea (< 10 ms) directamente en cliente o a través de un Route Handler local.
- **Consecuencias:** Búsqueda con soporte para prefijos, tolerancia a erratas (fuzzy matching) y filtrado facetado sin dependencias externas.

---

### D-011: Lógica del comparador multipartido: bloques comunes sin inferencias

- **Estado:** Aceptada
- **Contexto:** El comparador no debe inventar equivalencias entre propuestas ni asumir que la falta de mención equivale a una postura en contra.
- **Decisión:** El comparador estructura la información enfrentando los programas por bloque temático común. Si un partido no tiene propuestas en ese bloque temático, se indica explícitamente *"Sin propuestas registradas en este bloque"*, distinguiéndolo claramente de una postura de rechazo.
- **Consecuencias:** Neutralidad e integridad metodológica absoluta.

---

### D-012: Algoritmo de encuesta local-first con distinción de posición vs silencio

- **Estado:** Aceptada
- **Contexto:** `promt.md` sugería enviar respuestas de usuarios al servidor o calcular afinidad sumando productos sin manejar ausencias.
- **Decisión:**
  - **Local-first:** Las respuestas de los usuarios se procesan exclusivamente en el navegador (`localStorage` / estado React), sin persistencia en servidor ni rastreo analítico de opiniones políticas.
  - **Escala:** Escala Likert de 5 puntos: Muy en desacuerdo (-2), En desacuerdo (-1), Me da igual (0), De acuerdo (+1), Muy de acuerdo (+2). Botón adicional "Prefiero no responder" (ignora la pregunta para ese cálculo).
  - **Cálculo de afinidad:** Basado en similitud de Manhattan/coseno normalizada:
    $$\text{Afinidad}(p) = \frac{\sum_{i \in Q_p} \left(1 - \frac{|u_i - p_i|}{4}\right)}{|Q_p|} \times 100$$
    donde $Q_p$ es el subconjunto de preguntas donde el partido $p$ tiene una posición codificada (`status === 'posicion'`).
  - **Índice de cobertura:** Se muestra siempre junto a la afinidad el número de preguntas sobre las que se basa el cálculo (ej. *"Afinidad del 78% basada en 12 de las 15 preguntas"*). Si un partido no tiene posición documentada en una pregunta (`sin_referencia` o `insuficiente`), dicha pregunta se excluye del divisor para ese partido y se reporta la incertidumbre.
- **Consecuencias:** Cálculo matemáticamente transparente, neutral y respetuoso con la privacidad (cumplimiento estricto RGPD).

---

### D-013: Localizador de evidencias automático mediante alineación Docling

- **Estado:** Aceptada
- **Contexto:** Los detallados no contienen el número de página de las medidas, pero el JSON de Docling almacena cada token con su `prov[0].page_no`.
- **Decisión:** El script de compilación del corpus (`tools/data/build-corpus.ts`) ejecuta el algoritmo de alineación de texto normalizado desarrollado y probado en `scripts/auditar_corpus.py` para mapear automáticamente el fragmento a su página del PDF oficial y guardar la cita original de Docling.
- **Consecuencias:** 94,9% de las propuestas obtienen página de PDF verificable automáticamente sin intervención manual.

---

### D-014: Sistema de diseño mediante Tailwind CSS, CSS Custom Properties y WCAG 2.2 AA

- **Estado:** Aceptada
- **Contexto:** TweetElecciones fue citado en `promt.md` como referencia estética (sobriedad, legibilidad, foco en datos).
- **Decisión:** Emplear Tailwind CSS v4 con variables semánticas (Design Tokens) configuradas en CSS. Paleta sobria basada en grises de alto contraste, tipografía sans-serif legible (Inter o Geist), ratios de contraste superiores a 4.5:1, enlace "Saltar al contenido" y soporte completo de navegación por teclado.
- **Consecuencias:** Cumplimiento nativo de WCAG 2.2 Nivel AA e identidad visual propia, moderna y profesional.

---

### D-015: Cuarentena y remediación para Partido Humanista y SALF

- **Estado:** Aceptada
- **Contexto:** La auditoría demostró que en Partido Humanista (28/40 no localizados) y SALF (46/119 no localizados) el campo `texto_oficial` fue parafraseado o alterado durante la extracción de IA, conteniendo errores factuales comprobados frente al PDF.
- **Decisión:** Durante la Fase 2, todas las medidas de Partido Humanista y SALF cuyo texto no coincida literalmente con Docling se clasificarán automáticamente como `requiere_revision`. Se define una tarea específica de remediación (E-2 y E-3) en el plan de implementación para cotejar los textos con la capa de texto real del PDF antes de publicarlas.
- **Consecuencias:** Evita divulgar textos erróneos o manipulados en la plataforma pública.

---

### D-016: Metadatos no acreditados envueltos en Verifiable<T>

- **Estado:** Aceptada
- **Contexto:** Metadatos como `fecha_publicacion`, `url_programa_oficial` y `titulo_programa` provienen de los archivos derivados por IA y no de los metadatos oficiales de Docling.
- **Decisión:** Modelar estos campos bajo el tipo `Verifiable<T>` con estado `no_verificado` hasta que un revisor humano o registro oficial de descarga los corrobore.
- **Consecuencias:** Transparencia total sobre el grado de certeza de cada dato expuesto.

---

### D-017: Esquemas Zod como única fuente de verdad tipada

- **Estado:** Aceptada
- **Contexto:** Mantener esquemas JSON manuales y tipos TypeScript por separado genera divergencias.
- **Decisión:** Definir todos los esquemas en TypeScript utilizando **Zod**. Los tipos de TypeScript se infieren directamente (`z.infer<typeof Schema>`) y los archivos JSON Schema estándar (`.schema.json`) se generan automáticamente a partir de Zod mediante un comando de compilación.
- **Consecuencias:** Validación de runtime y tiempo de compilación unificada al 100%.

---

### D-018: Preservación de la lengua oficial original de las propuestas

- **Estado:** Aceptada
- **Contexto:** El programa del BNG fue redactado y aprobado oficialmente en lengua gallega (*galego*).
- **Decisión:** El campo `official_text` preserva escrupulosamente la lengua original en la que el partido publicó el documento oficial, indicando `language: "gl"`. En la interfaz se mostrará el texto original con una indicación clara de idioma y se permitirá opcionalmente ofrecer traducción o resumen neutral en castellano etiquetado como tal.
- **Consecuencias:** Respeto escrupuloso a la autenticidad del documento fuente primario.

---

### D-019: Entrega en streaming y solo lectura de PDFs originales mediante Route Handler con HTTP Range

- **Estado:** Aceptada (Fase 1)
- **Contexto:** `ARCHITECTURE.md` §6 contemplaba usar enlaces simbólicos en `public/pdfs` o reglas `rewrites()` en `next.config.ts` para servir `pdfs_originales/` bajo `/pdfs/:path*` sin duplicar archivos. Al validar ambos mecanismos en Fase 1 sobre el entorno real:
  1. `rewrites()` en Next.js solo redirige entre rutas HTTP o destinos externos y **no puede servir directorios del sistema de archivos situados fuera de `public/`**.
  2. Crear enlaces simbólicos o uniones de directorio (`SymbolicLink` / `Junction`) dentro de `public/` en Windows requiere privilegios elevados o Modo Desarrollador y, sobre directorios sincronizados con OneDrive, introduce riesgo de materialización/duplicación de los 114 MB de fuentes primarias o conflictos de sincronización.
- **Decisión:** Implementar un Route Handler dedicado en `src/app/pdfs/[filename]/route.ts` (`runtime = "nodejs"`, `dynamic = "force-dynamic"`) que sirve los archivos de `pdfs_originales/` directamente mediante streams de solo lectura (`createReadStream` con `flags: "r"`), con validación estricta del nombre de archivo contra *path traversal*, soporte `HEAD` y `GET`, y soporte completo de rangos parciales RFC 9110 (`Accept-Ranges: bytes`, `206 Partial Content`, `416 Range Not Satisfiable`). En paralelo, configurar `X-Frame-Options: SAMEORIGIN` y `outputFileTracingExcludes` en `next.config.ts` para permitir previsualización embebida en el mismo origen y excluir `procesados/` (~190 MB) del rastreo de bundles de servidor.
- **Consecuencias:**
  - Positivas: Cero duplicación en disco (ni en `public/` ni en la caché de páginas estáticas de `.next/`), portabilidad total multiplataforma (Windows/OneDrive, Linux, Docker), navegación directa e instantánea a `/pdfs/<archivo>.pdf#page=X` incluso en PDFs de gran tamaño (69 MB de Coalición Canaria) e inmutabilidad criptográfica SHA-256 intacta al 100%.
  - Negativas: Requiere runtime Node.js estándar (ya previsto por [D-001](#d-001-monolito-modular-basado-en-nextjs-app-router-react-y-typescript)), descartando `output: "export"` puro salvo que un despliegue estático externo mapee `/pdfs/*` en CDN.

