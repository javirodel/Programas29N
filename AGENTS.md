# AGENTS.md — Instrucciones Permanentes para Agentes de Programación

> Este documento es la guía de referencia mandatoria para cualquier modelo de lenguaje o agente de programación que opere en el repositorio **29N**. Léelo íntegramente antes de proponer cambios o escribir código.

---

## 1. El Proyecto en Pocas Palabras

El repositorio `29N` contiene los programas electorales oficiales de las elecciones generales del 29 de noviembre (29N), sus extracciones estructuradas y la base arquitectónica para construir una plataforma cívica web de consulta, comparación y test de afinidad neutral, rigurosa y accesible.

---

## 2. Reglas Críticas e Inquebrantables

1. **Inmutabilidad del Corpus Primario Existente:**
   - **NUNCA** modifiques, renombres, muevas ni sobrescribas los archivos ya auditados dentro de `pdfs_originales/` o `procesados/`.
   - **NUNCA** ejecutes `scripts/procesarTodo.ps1 -Force` sobre documentos ya procesados. Si se incorporan nuevos programas oficiales publicados con posterioridad, se procesan de forma individual y aditiva.
2. **Prohibición de Inventar Datos:**
   - **NUNCA** inventes propuestas, posiciones políticas, citas, páginas ni justificaciones de voto.
   - Si falta información sobre un tema o un partido guarda silencio en su programa, regístralo explícitamente como `sin_referencia` o `insuficiente`. **El silencio nunca equivale a una postura en contra.**
3. **No Confundir Datos Extraídos ni Análisis IA con Datos Verificados:**
   - Distingue siempre entre registros extraídos automáticamente, análisis contextual IA (`ai_annotations`: `explicacion_medida`, `datos_a_favor`, `datos_en_contra`) y medidas verificadas manualmente contra el PDF oficial.
   - Los campos derivados por IA (`explicacion_medida`, `datos_a_favor`, `datos_en_contra`) pueden mostrarse bajo un desplegable colapsado por defecto (**«A favor y en contra»**) separados del texto literal oficial del partido, documentando su origen e independencia editorial de forma centralizada en la sección dedicada (`/metodologia`) (Decisión [D-006 v1.2](docs/DECISIONS.md#d-006-tratamiento-de-análisis-ia-no-verificados-en-la-vista-pública)).
4. **Respeto a la Jerarquía de 5 Capas:**
   - **N0:** PDF original (fuente inmutable).
   - **N1:** Artefactos Docling (`.md`, `.json`, `.txt`, `metadata.json`). Solo lectura.
   - **N2:** Análisis derivados por IA (`*_detallado.json`). Solo lectura.
   - **N3:** Capa de curación y configuración humana en `data/` (editable mediante PRs).
   - **N4:** Dataset normalizado de entrega en `.generated/` (generado en build time; nunca se edita a mano).
5. **Simplicidad Arquitectónica (Monolito Modular):**
   - No introduzcas microservicios, bases de datos externas (PostgreSQL, Supabase), brokers de mensajes ni servicios de inferencia en la nube para el MVP.
   - Toda la lógica reside en el monolito Next.js y el pipeline de datos en build time.

---

## 3. Mapa de Documentación Canónica

Antes de iniciar cualquier tarea, consulta el documento rector correspondiente:

| Documento | Contenido y Propósito |
| :--- | :--- |
| [`docs/DATA_AUDIT.md`](docs/DATA_AUDIT.md) | Auditoría forense real de los 9 programas, hashes SHA-256, recuentos y trazabilidad. |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Contratos TypeScript, esquemas Zod, jerarquía N0–N4 e invariantes del modelo. |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Arquitectura técnica del monolito modular Next.js, contratos de módulos y pipeline. |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Registro de Decisiones de Arquitectura (ADRs D-001 a D-018). |
| [`docs/PRD.md`](docs/PRD.md) | Requisitos funcionales y no funcionales detallados y auditoría crítica de `promt.md`. |
| [`docs/PRODUCT_BRIEF.md`](docs/PRODUCT_BRIEF.md) | Propuesta de valor, principios editoriales, personas de usuario y métricas de éxito. |
| [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) | Fases secuenciales de desarrollo con tareas, dependencias y criterios de aceptación. |
| [`docs/STATUS.md`](docs/STATUS.md) | Estado actual del proyecto y **especificación de la siguiente tarea exacta a ejecutar**. |

---

## 4. Convenciones de Desarrollo y Código

- **Lenguaje y Tipado:** TypeScript en modo estricto (`"strict": true`). Todo dato proveniente de archivos JSON externos debe validarse mediante esquemas **Zod** antes de su consumo en la aplicación.
- **Rutas y Framework:** Next.js App Router (`src/app/`). Componentes de React funcionales y tipados.
- **Estilos:** Tailwind CSS v4 complementado con variables CSS semánticas para Design Tokens (`src/modules/ui/tokens.css`).
- **Accesibilidad:** WCAG 2.2 Nivel AA como requisito no negociable. Siempre incluye enlaces *"Saltar al contenido principal"*, foco visible y marcado semántico nativo (`<main>`, `<nav>`, `<article>`, `<header>`).
- **Manejo de Errores e Incertidumbre:** Ante datos ausentes o no verificados, utiliza el envoltorio `Verifiable<T>` y muestra mensajes explicativos y honestos al usuario en lugar de cadenas vacías o valores por defecto inventados.
- **Lenguas Oficiales:** Preserva el idioma original de cada propuesta oficial (ej. texto en gallego en el BNG con `language: "gl"`).

---

## 5. Protocolo de Trabajo para Siguientes Agentes

1. **Comprobar Estado:** Abre y lee [`docs/STATUS.md`](docs/STATUS.md) para identificar en qué fase y tarea concreta se encuentra el proyecto.
2. **Consultar el Plan:** Revisa [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) para conocer las dependencias, archivos afectados y criterios de aceptación de la tarea asignada.
3. **Ejecutar con Criterio Mínimo:** No te adelantes a fases posteriores ni agregues funcionalidades no planificadas.
4. **Verificar:** Antes de dar por concluida tu intervención, ejecuta los tests o comandos de validación pertinentes (p. ej. `npm run typecheck`, `npm run data:build`, `python scripts/auditar_corpus.py`).
5. **Actualizar el Estado:** Al terminar, actualiza siempre [`docs/STATUS.md`](docs/STATUS.md) indicando las tareas concluidas, las decisiones tomadas y la siguiente tarea recomendada para el próximo turno.
