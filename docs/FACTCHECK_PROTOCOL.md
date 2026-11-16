# FACTCHECK_PROTOCOL.md — Contraste de medidas y análisis «a favor / en contra»

> Protocolo para revisar que (1) cada medida publicada en la app es fiel al programa oficial y
> (2) la explicación y los datos a favor / en contra son veraces y están respaldados por fuentes.
> Complementa [AGENTS.md](../AGENTS.md), [DATA_MODEL.md](DATA_MODEL.md) y la decisión D-006 / D-020.

## 1. Capas que se tocan (y cuáles NO)

- **NUNCA** se editan `pdfs_originales/` (N0), los artefactos Docling (N1) ni los `*_detallado.json/.md` (N2).
- Las correcciones se escriben exclusivamente en la capa N3:
  - `data/annotations/<partido>[.partN].json` → contraste del análisis IA (explicación, a favor, en contra) **con fuentes**.
  - `data/reviews/<partido>.factcheck[-partN].json` → correcciones de **título o texto oficial** de medidas que aún no tienen overlay en `data/reviews/`.
- El pipeline (`npm run data:build`) fusiona ambos overlays sobre N2 y genera N4.

## 2. Material de trabajo

- Lote por tramo: `.generated/review-batches/slices/<partido>[.partN].json`. Cada ítem trae:
  `id`, `title`, `official_text`, `match`, `pages`, `gap_to_next_measure_chars`,
  `n1_context` (texto literal Docling desde el inicio de la medida hasta la siguiente, con `[p.N]`),
  `explicacion_medida`, `datos_a_favor`, `datos_en_contra`.
- Texto completo del programa: `procesados/<Partido>_programa29N/<Partido>_programa29N.md` (y `.txt`).

## 3. Comprobaciones por medida

### 3.1 Fidelidad al programa (texto y título)
1. Compara `official_text` con `n1_context`. Debe ser **literal** (se admiten diferencias de viñetas,
   saltos de línea o guiones de separación silábica).
2. Señales de problema: `match = "fragmentado"` (la parte central puede diferir), `gap_to_next_measure_chars`
   alto (> 150) con texto de la misma medida que se ha quedado fuera (truncado), frases añadidas que no
   están en el PDF, o mezcla de dos medidas distintas.
3. El `title` puede ser un rótulo generado por IA: debe describir fielmente la medida, sin añadir
   matices, valoraciones ni datos que no estén en el texto.
4. Si falla: crea/edita `data/reviews/<partido>.factcheck[-partN].json` con
   `official_text.text` = pasaje **contiguo y literal** copiado de N1 (sin marcas `[p.N]`) y/o `title` corregido,
   `"status": "extraida"`, `reviewer: "contraste-ia-fuentes"`, fecha y `note` explicando el fallo.
   Respeta el idioma original (`language: "gl"`, `"ca"`, `"eu"` si procede). No traduzcas.
   Si el ID ya tiene overlay en otro fichero de `data/reviews/`, no lo dupliques: anótalo en tu informe final.

### 3.2 Explicación (`summary`)
- Debe resumir **todo** el contenido de la medida (no solo el primer punto) sin añadir propuestas
  inexistentes, cifras inventadas ni valoraciones. Si es incompleta o inexacta, se corrige.

### 3.3 Datos a favor / en contra
- Cada afirmación fáctica (cifras, fechas, leyes, sentencias, estudios, comparativas) debe ser
  **verdadera y comprobable**. Usa búsqueda web y prioriza fuentes primarias:
  BOE/EUR-Lex/TC/TJUE/TEDH, INE, Eurostat, Banco de España, AIReF, AEAT, Seguridad Social, ministerios,
  CIS, OCDE, FMI, Comisión Europea, ONU/OMS, organismos autonómicos, universidades y estudios revisados;
  en su defecto, medios de comunicación de referencia.
- Si una afirmación es falsa, exagerada, desactualizada o no verificable → **reescríbela** con datos que sí
  puedas respaldar, o elimina esa parte. No inventes cifras. Mantén un tono neutral y equilibrado:
  un argumento a favor y otro en contra de calidad comparable.
- Los argumentos valorativos («podría encarecer…») deben apoyarse en evidencia o análisis citables
  (informes, estudios, dictámenes, competencias constitucionales, etc.).

### 3.4 Fuentes
- Mínimo **1 fuente por columna** (`sources_for`, `sources_against`); idealmente 1–3.
- Cada fuente: `title`, `publisher`, `url` (URL final real; nunca enlaces de redirección del buscador)
  y `date` si se conoce.
- La URL debe existir y respaldar realmente la afirmación. Resuelve redirecciones con
  `node tools/data/resolve-urls.ts <url>`. Reutilizar una misma fuente en varias medidas es correcto.
- Prohibido inventar o «reconstruir» URLs de memoria sin comprobarlas.

## 4. Formato de `data/annotations/<partido>[.partN].json`

```json
{
  "schema_version": "1.0.0",
  "party_id": "vox",
  "entries": {
    "vox-002": {
      "status": "corregida",
      "summary": "… (solo si se corrige)",
      "arguments_for": "… (solo si se corrige)",
      "arguments_against": "… (solo si se corrige)",
      "sources_for": [{ "title": "…", "publisher": "…", "url": "https://…", "date": "2026" }],
      "sources_against": [{ "title": "…", "publisher": "…", "url": "https://…" }],
      "reviewer": "contraste-ia-fuentes",
      "date": "2026-11-13",
      "note": "Qué se comprobó y qué se corrigió."
    }
  }
}
```

- `status: "contrastada"` → el texto IA original es correcto; solo se añaden fuentes (no incluyas summary/arguments).
- `status: "corregida"` → se reescribe al menos uno de los tres textos.
- Toda medida publicable del tramo debe tener entrada.

## 5. Validación (sin regenerar `.generated/`)

```bash
node tools/data/validate-factcheck.ts data/annotations/<fichero>.json [data/reviews/<fichero>.json]
node tools/data/check-annotation-sources.ts <fichero>.json   # comprueba que las URLs responden
```

`npm run data:build` lo ejecuta el coordinador al integrar todos los tramos.

## 6. Etiquetado público

La UI muestra las fuentes enlazadas bajo cada columna y la leyenda «Análisis contextual generado por IA y
contrastado con las fuentes enlazadas mediante revisión asistida por IA; pendiente de verificación humana».
El contraste lo realizan agentes de IA: **no** equivale a verificación humana (D-006).
