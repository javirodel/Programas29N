# PRD — Product Requirements Document (Especificación de Requisitos)

- **Versión:** 1.1.0
- **Fecha:** 2026-11-13
- **Estado:** Actualizado tras expansión a 12 candidaturas, modo oscuro y enmienda D-006 v1.1
- **Documento base analizado:** [`promt.md`](../promt.md) (Auditoría del Prompt Maestro incorporada en §3)

---

## 1. Requisitos Funcionales (RF)

### RF-CAT: Catálogo de Programas Electorales
- **RF-CAT-01:** La aplicación debe presentar una página principal orientada al test de afinidad y con acceso al catálogo de los 12 programas electorales oficiales presentes en el corpus (Adelante Andalucía, BNG, Coalición Canaria, ERC, Frente Obrero, Iustitia Europa, EAJ-PNV, PP, Partido Humanista, Por Un Mundo Más Justo, SALF y VOX).
- **RF-CAT-02:** Cada tarjeta de programa debe mostrar: nombre de la formación, título del programa oficial, fecha de publicación (indicando si está pendiente de verificación), número de páginas del PDF, recuento de propuestas extraídas y publicadas, y botón de acceso al programa.
- **RF-CAT-03:** Cada tarjeta debe incluir un enlace directo para visualizar o descargar el PDF oficial primario (`/pdfs_originales/<archivo>.pdf`).
- **RF-CAT-04:** La interfaz debe permitir filtrar los programas por nombre/sigla y ordenar por orden alfabético o volumen de propuestas.

### RF-VIS: Visor Individual de Programa
- **RF-VIS-01:** Cada programa debe contar con una página propia bajo la ruta `/programas/[party_id]`.
- **RF-VIS-02:** La cabecera del visor debe mostrar los metadatos completos del programa, el hash SHA-256 del PDF original y un botón de descarga del documento inmutable.
- **RF-VIS-03:** Debe existir un menú de navegación temático o índice anclado lateral que permita saltar directamente a cualquiera de los 19 bloques canónicos en los que el partido tenga propuestas.
- **RF-VIS-04:** Para cada propuesta publicada se debe mostrar:
  1. Título de la propuesta y número correlativo en el corpus.
  2. Sección original identificada en el programa.
  3. Texto oficial literal (respetando la lengua oficial en la que fue redactado, como el gallego en el BNG o el catalán en ERC).
  4. Indicador visual de procedencia y calidad de extracción (`Verificada`, `Extracción automática · pendiente de revisión`).
  5. Botón interactivo *"Ver evidencia"* que despliegue la cita textual de extracción y el número de página del PDF oficial.
  6. Enlace que abra el PDF en el visor del navegador en la página exacta referenciada (`#page=X`).
- **RF-VIS-05:** Si un partido tiene medidas marcadas como `requiere_revision`, `rechazada` o `reservada`, estas **no se mostrarán en la lista principal de propuestas**, pero se indicará un contador transparente: *"X propuestas en revisión editorial"* o *"8 medidas reservadas de campaña"* (en el caso del PP).
- **RF-VIS-06:** Los campos derivados por IA (`explicacion_medida`, `datos_a_favor`, `datos_en_contra`) se muestran únicamente dentro de un desplegable colapsado por defecto (**«Análisis y datos (a favor / en contra)»**) con etiqueta visible de **análisis contextual generado por IA pendiente de verificación humana**, separados del texto literal del partido, según enmienda [D-006 v1.1](DECISIONS.md#d-006-tratamiento-de-análisis-ia-no-verificados-en-la-vista-pública).

### RF-COMP: Comparador Multipartido
- **RF-COMP-01:** La ruta `/comparar` debe permitir al usuario seleccionar entre 2 y 4 formaciones políticas para contrastar sus posturas.
- **RF-COMP-02:** La comparación debe organizarse obligatoriamente a través de los **19 bloques temáticos canónicos** (Vivienda, Economía, Fiscalidad, etc.).
- **RF-COMP-03:** En ningún caso se generarán o inferirán posiciones no explicitadas. Si un partido no tiene propuestas en un bloque temático determinado, se mostrará claramente la etiqueta: *"Sin propuestas registradas en este bloque"*.
- **RF-COMP-04:** Cada celda o columna temática debe listar las propuestas literales del partido en ese bloque, con acceso inmediato a su evidencia en el PDF.
- **RF-COMP-05:** En dispositivos móviles, la tabla comparativa debe transformarse en una vista de pestañas o acordeones por bloque temático para garantizar la legibilidad y evitar desbordamientos horizontales inmanejables.

### RF-BUS: Buscador Global de Propuestas
- **RF-BUS-01:** La ruta `/buscar` debe ofrecer un motor de búsqueda instantáneo sobre el texto oficial y el título de todas las propuestas publicables del corpus.
- **RF-BUS-02:** Debe permitir filtros combinados y reactivos:
  1. Filtro por partido (selección múltiple).
  2. Filtro por bloque temático canónico (selección múltiple).
  3. Filtro por estado de revisión (`Verificadas`, `Todas las publicadas`).
- **RF-BUS-03:** Los filtros y la consulta de búsqueda deben sincronizarse bidireccionalmente con los parámetros de la URL (`query parameters`) para permitir compartir enlaces directos a búsquedas específicas.
- **RF-BUS-04:** Cada resultado de búsqueda debe resaltar los términos coincidentes y mostrar el partido, el bloque temático, el número de página en el PDF y el enlace directo al documento fuente.
- **RF-BUS-05:** Debe contemplar estados claros de: *Cargando*, *Sin resultados* (con sugerencias de búsqueda) y *Error*.

### RF-ENC: Encuesta de Afinidad Temática (Test de Orientación)
- **RF-ENC-01:** La ruta `/encuesta` debe ofrecer un cuestionario temático en **modo 5 minutos** compuesto por 15 preguntas neutrales, seleccionadas de forma equilibrada entre los distintos bloques canónicos.
- **RF-ENC-02:** Cada pregunta debe formularse como una afirmación neutral y concisa sobre una política pública concreta (ej. *"Se debe aumentar la oferta de vivienda protegida mediante movilización de suelo público"*), sin mencionar partidos ni líderes.
- **RF-ENC-03:** Las opciones de respuesta deben seguir una escala Likert estricta de 5 niveles:
  1. Muy en desacuerdo (-2)
  2. En desacuerdo (-1)
  3. Me da igual / Posición neutral (0)
  4. De acuerdo (+1)
  5. Muy de acuerdo (+2)
  6. Opción especial discreta: *"Prefiero no responder / Desconozco"* (excluye la pregunta del cálculo para evitar sesgos).
- **RF-ENC-04:** Toda pregunta del banco debe contar con la codificación de las posiciones de **los 12 partidos**, distinguiendo obligatoriamente entre:
  - `posicion`: Valor de -2 a +2 respaldado por al menos un ID de propuesta pública.
  - `insuficiente`: La formación trata el tema de manera genérica pero no fija postura inequívoca.
  - `sin_referencia`: No se localizó mención en el programa tras búsqueda rigurosa.
- **RF-ENC-05:** El algoritmo de afinidad debe calcularse en el navegador del usuario (local-first) aplicando la fórmula de similitud normalizada definida en [D-012](DECISIONS.md#d-012-algoritmo-de-encuesta-local-first-con-distinción-de-posición-vs-silencio).
- **RF-ENC-06:** La pantalla de resultados debe presentar:
  1. Porcentaje de afinidad global por partido (0 a 100%).
  2. **Índice de cobertura de datos:** Número de preguntas con posición documentada sobre las que se basa el cálculo (ej. *"Afinidad del 74% (basada en 13 de 15 preguntas con postura registrada)"*).
  3. Desglose de afinidad por bloque temático.
  4. Sección de transparencia *"Cómo votaste frente a cada partido"* con enlaces directos a las propuestas que justifican la postura asignada a cada formación.
  5. Descargo de responsabilidad explícito: aviso de que el test es meramente orientativo y no constituye recomendación ni inducción al voto.

### RF-MET: Metodología, Auditoría y Fuentes
- **RF-MET-01:** La ruta `/metodologia` debe documentar exhaustivamente el pipeline de extracción (Docling), el proceso de auditoría forense, los criterios de revisión manual y las limitaciones conocidas del corpus.
- **RF-MET-02:** Debe incluir una tabla con el estado de auditoría en tiempo real de cada uno de los 9 programas, mostrando hashes SHA-256, recuentos de propuestas y fecha de corte de los datos.
- **RF-MET-03:** Enlace a la descarga pública del informe de auditoría (`audit_result.json`) y a la documentación del repositorio.

---

## 2. Requisitos No Funcionales (RNF)

- **RNF-ACC (Accesibilidad):** Cumplimiento estricto de las directrices **WCAG 2.2 Nivel AA**. Ratio de contraste de color mínimo de 4.5:1 para texto normal y 3:1 para elementos de interfaz. Soporte completo de navegación por teclado, enlace accesible visible al foco *"Saltar al contenido principal"*, atributos ARIA correctos y marcado semántico HTML5.
- **RNF-PERF (Rendimiento):** Puntuación en Google Lighthouse ≥ 90 en Desktop y Móvil para todas las vistas. Tiempo de carga de la primera página (FCP) < 1.2 s en conexiones estándar.
- **RNF-PRIV (Privacidad y RGPD):** Arquitectura *Local-First* para la encuesta. No se utilizan cookies analíticas de terceros ni se registran en servidor las respuestas políticas del usuario. Respeto absoluto del Reglamento General de Protección de Datos de la UE.
- **RNF-TRAZ (Trazabilidad y Verificabilidad):** Ninguna propuesta se publicará en el catálogo si no cuenta con un enlace a su documento PDF fuente y al menos una referencia de página localizada.
- **RNF-SEG (Seguridad):** Cabeceras de seguridad estrictas (Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, Strict-Transport-Security). Sanitización de cualquier entrada de texto para evitar vulnerabilidades XSS.

---

## 3. Auditoría Crítica de `promt.md` (Prompt Maestro)

Como parte de la Fase 0, se ha realizado una revisión técnica exhaustiva del documento de especificación funcional inicial (`promt.md`). Se identifican las siguientes inconsistencias, ambigüedades y desviaciones que quedan corregidas formalmente en este PRD y en la arquitectura técnica:

### 3.1 Ambigüedades tecnológicas no decididas
- **Defecto en `promt.md`:** Dejaba abiertas múltiples disyuntivas tecnológicas: Express vs FastAPI vs Supabase vs Next.js API; Tailwind CSS vs Material UI; PostgreSQL vs Elasticsearch vs pgvector vs búsquedas semánticas externas.
- **Corrección aplicada:** Se fija un **monolito modular único** en Next.js (App Router), React y TypeScript estricto, con Tailwind CSS v4 para diseño. Se prescinde de bases de datos relacionales y motores vectoriales para el MVP, adoptando un dataset compilado e indexado en build (`.generated/corpus.v1.json` + `search-index.v1.json`). Ver decisiones [D-001](DECISIONS.md#d-001-monolito-modular-basado-en-nextjs-app-router-react-y-typescript), [D-002](DECISIONS.md#d-002-base-de-datos-estática-compilada-generated-para-mvp-sin-base-de-datos-relacional-obligatoria-en-runtime) y [D-010](DECISIONS.md#d-010-motor-de-búsqueda-en-memoria-indexado-en-build-minisearch-para-mvp).

### 3.2 Inconsistencias de formato de datos (Markdown vs JSON)
- **Defecto en `promt.md`:** Afirmaba en la línea 166 que *"El contenido maestro será el Markdown generado (extraído de Docling)"*, pero al mismo tiempo prescribía consumir el JSON estructurado para bloques y propuestas.
- **Corrección aplicada:** La auditoría demostró que el Markdown de Docling contiene artefactos de maquetación e imágenes en base64 de hasta 2 MB. El **árbol JSON de Docling (`.json`) es la fuente primaria de evidencia estructurada**, mientras que los archivos `*_detallado.json` constituyen la lista de medidas candidatas. El Markdown no debe consumirse como fuente de datos en la aplicación.

### 3.3 Ejemplos ficticios con partidos reales y posiciones no contrastadas
- **Defecto en `promt.md`:** En las líneas 281-290 presentaba un ejemplo numérico asignando posturas ficticias sobre sanidad: *"PP=-1, PSOE=+2, VOX=0"*, citando páginas ficticias ("source_page: 34", "source_page: 22"). Además, PSOE y VOX **no forman parte de los nueve programas disponibles en este repositorio**.
- **Corrección aplicada:** Queda formalmente prohibido utilizar ejemplos ficticios que atribuyan posiciones a partidos reales sin respaldo documental. El banco de preguntas de la encuesta (Fase 5) se construirá exclusivamente sobre los nueve partidos auditados y con citas a propuestas publicadas reales.

### 3.4 Metodología deficiente del comparador y de la encuesta
- **Defecto en `promt.md`:** Proponía una fórmula de afinidad simple: `(1/N) * Σ (resp * pos)`, la cual:
  1. Produce resultados anómalos si se omiten preguntas.
  2. No distingue entre un partido que vota en contra y un partido que guarda silencio sobre un tema.
  3. No contempla la abstención informada (*"Prefiero no responder"*).
- **Corrección aplicada:** Se formaliza el triple estado (`posicion`, `insuficiente`, `sin_referencia`), se adopta la métrica de Manhattan normalizada por cobertura efectiva ([D-012](DECISIONS.md#d-012-algoritmo-de-encuesta-local-first-con-distinción-de-posición-vs-silencio)) y se obliga a reportar el índice de cobertura de datos para garantizar la imparcialidad.

### 3.5 Suposiciones no acreditadas sobre TweetElecciones
- **Defecto en `promt.md`:** Atribuía a la referencia externa patrones de diseño (como controles interactivos "Play", sliders de animación y métricas de redes sociales) que no son aplicables a un visor de programas electorales.
- **Corrección aplicada:** Se extraen exclusivamente los principios positivos de TweetElecciones: **sobriedad tipográfica, foco absoluto en los datos, enlaces de accesibilidad "Saltar al contenido" y paleta neutra**, descartando animaciones superfluas o metáforas de redes sociales ajenas al dominio electoral.

### 3.6 Requisitos innecesarios eliminados del MVP
Se eliminan o posponen formalmente al Roadmap posterior los siguientes requisitos citados en `promt.md` que generarían deuda técnica o complejidad injustificada:
1. **Autenticación y roles de usuario:** La aplicación es 100% pública y de consulta abierta.
2. **Panel de administración editorial web (CMS):** Las revisiones y correcciones se gestionan en el repositorio mediante archivos de overlay JSON versionados en `data/reviews/`.
3. **Búsqueda vectorial / embeddings semánticos:** Reemplazados por búsqueda de texto completo con tolerancia a erratas (MiniSearch) para garantizar resultados verificados al 100% y cero costes de inferencia externa.
4. **Infraestructura de colas (BullMQ, AWS Batch) y reprocesamiento de PDFs:** Los 9 programas ya están convertidos; no se ejecutarán conversiones en tiempo de ejecución.
5. **Mapas geográficos de compromisos autonómicos:** No existen datos georreferenciados homogéneos en el corpus actual.

---

## 4. Matriz de Trazabilidad de Requisitos

| Requisito PRD | Módulo Arquitectura | Datos Consumidos | Criterio de Aceptación Principal |
| :--- | :--- | :--- | :--- |
| **RF-CAT** | `modules/catalog` | `corpus.v1.json (Party, Program)` | Lista 9 partidos, enlaces a PDF activos y SHA-256 verificado. |
| **RF-VIS** | `modules/programs` | `corpus.v1.json (Program, Proposal, Evidence)` | Cita literal, evidencia con pág. de PDF, filtro de propuestas en revisión. |
| **RF-COMP** | `modules/comparator` | `corpus.v1.json (Theme, Proposal)` | 2-4 partidos, 19 bloques canónicos, distinción de ausencia explícita. |
| **RF-BUS** | `modules/search` | `search-index.v1.json` | Filtros combinados, respuesta < 50ms, enlaces a páginas exactas. |
| **RF-ENC** | `modules/survey` | `survey.v1.json` | 15 preguntas, cálculo local-first, reporte de cobertura y enlaces a pruebas. |
| **RF-MET** | `modules/methodology` | `coverage-report.json`, `audit_result.json` | Documentación de auditoría completa, reproducibilidad acreditada. |
| **RNF-ACC** | Global UI | Tokens de diseño, Layouts | Lighthouse Accesibilidad ≥ 90, cero fallos axe-core, WCAG 2.2 AA. |
