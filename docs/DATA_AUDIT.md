# DATA_AUDIT — Auditoría real del corpus 29N

- **Fecha de la auditoría:** 2026-11-12
- **Alcance:** `pdfs_originales/`, `procesados/`, `scripts/`, `logs/`, `README.md`.
- **Método:** inspección de solo lectura. No se ha reprocesado ningún PDF ni modificado ningún artefacto.
- **Reproducible con:** `python scripts/auditar_corpus.py` → [`docs/audit/audit_result.json`](audit/audit_result.json).
  Las comprobaciones puntuales contra la capa de texto del PDF (pypdfium2) se describen en §5.

> [!IMPORTANT]
> Ninguna medida del corpus ha sido **revisada por una persona**. Todo lo que sigue describe
> datos *extraídos* (Docling) o *derivados por IA* (archivos `*_medidas_detallado.*`).
> "Localizada automáticamente" **no** significa "verificada".

---

## 1. Resumen ejecutivo

| Indicador | Valor |
| :--- | ---: |
| Programas (partidos) | 9 |
| PDF originales presentes | 9 / 9 |
| SHA-256 del PDF coincide con `metadata.json` | 9 / 9 |
| Artefactos Docling (MD + JSON + TXT) presentes y no vacíos | 9 / 9 |
| JSON de Docling sintácticamente válidos (`DoclingDocument` v1.11.0) | 9 / 9 |
| Archivos de medidas detalladas (JSON + MD) | 9 / 9 |
| **Medidas extraídas** (suma de los nueve `*_detallado.json`) | **1.652** |
| Medidas cuyo `texto_oficial` aparece literalmente en el artefacto Docling (normalizado) | 1.439 (87,1 %) |
| Medidas localizadas de forma fragmentada (inicio y final presentes) | 81 (4,9 %) |
| Medidas localizadas solo parcialmente | 48 (2,9 %) |
| Medidas **no localizadas** en el artefacto Docling | 84 (5,1 %) |
| Medidas con página candidata localizable automáticamente | 1.568 (94,9 %) |
| Medidas "reservadas" sin contenido (PP) | 8 |
| **Medidas normalizadas** (dataset de aplicación validado) | **0** — no existe todavía |
| **Medidas revisadas por una persona** | **0** |

La cifra "≈1.500 medidas" que circulaba en el proyecto **es incorrecta**: hay 1.652 registros
extraídos. Ninguno constituye todavía una "propuesta verificada".

---

## 2. Inventario por partido

### 2.1 Fuente primaria y artefactos Docling

| Partido | PDF (bytes) | Págs. PDF | Págs. Docling | SHA-256 = metadata | MD (bytes) | JSON (bytes) | TXT (caracteres) | Herramienta registrada |
| :--- | ---: | ---: | ---: | :---: | ---: | ---: | ---: | :--- |
| BNG | 1.387.491 | 91 | 91 | ✅ | 2.110.738 | 61.115.552 | 179.937 | Docling (CLI) |
| Coalición Canaria | 69.215.587 | 23 | 23 | ✅ | 1.353.498 | 17.736.893 | 63.123 | Docling (CLI) |
| Frente Obrero | 1.202.338 | 64 | 64 | ✅ | 85.602 | 633.708 | 82.091 | Docling (PyPdfiumBackend) |
| Iustitia Europa | 4.962.917 | 28 | 28 | ✅ | 724.171 | 7.753.185 | 29.017 | Docling (CLI) |
| EAJ-PNV | 509.986 | 43 | 43 | ✅ | 319.256 | 20.134.558 | 85.447 | Docling (CLI) |
| PP | 12.279.932 | 82 | 82 | ✅ | 163.177 | 877.648 | 158.073 | Docling (PyPdfiumBackend) |
| Partido Humanista | 461.126 | 31 | 31 | ✅ | 419.774 | 12.811.573 | 53.237 | Docling (CLI) |
| Por Un Mundo Más Justo | 4.952.507 | 95 | 95 | ✅ | 1.235.034 | 44.868.958 | 146.863 | Docling (CLI) |
| SALF | 19.063.086 | 40 | 40 | ✅ | 2.027.428 | 23.866.671 | 52.872 | Docling (CLI) |

Observaciones sobre los artefactos Docling:

- **Todos los PDF tienen capa de texto** (verificado con pypdfium2). El volumen de texto de los
  artefactos Docling es coherente con la capa de texto del PDF en los nueve casos. No se requiere OCR
  para el corpus actual.
- **Dos configuraciones de extracción distintas.** Siete programas se procesaron con el CLI de Docling
  (pipeline estándar con modelo de layout; imágenes incrustadas en base64 en el Markdown, de ahí MD de
  hasta 2 MB). PP y Frente Obrero se reprocesaron con `scripts/convertir_docling.py` (PyPdfiumBackend;
  imágenes como `<!-- image -->`). Los artefactos no son homogéneos en formato, aunque sí en esquema JSON.
- **`metadata.json` heterogéneo.** Los siete del CLI registran `codigo_salida` y `archivo_estandar`,
  pero no `paginas` ni `tamano_bytes`. Los dos de PyPdfium registran `paginas` y `tamano_bytes`
  (que coinciden con los archivos actuales). **Ningún** `metadata.json` registra URL de origen,
  fecha de descarga ni versión de Docling.
- Todos los elementos de texto del JSON Docling tienen procedencia (`prov.page_no`): la localización
  de página es técnicamente posible para cualquier fragmento extraído.
- **Iustitia Europa:** el TXT contiene 154 caracteres de sustitución (`�`) en algunos pasajes con
  fuentes no decodificables. No afecta a la localización de las 101 medidas, pero esos pasajes no son
  legibles en el artefacto.
- Páginas con poco texto (<200 caracteres) corresponden a portadas, separadores de capítulo y
  contraportadas; son coherentes con el PDF (ver `paginas_texto_escaso_lt200` en el JSON de auditoría).

### 2.2 Problemas históricos de Docling (PP y Frente Obrero)

`logs/informe_conversion.*` registra que la primera conversión de `LA-RECONSTRUCCION-NACIONAL.pdf` (PP)
y `Programa.pdf` (Frente Obrero) **falló** con código `-1073740791` (excepción nativa de Windows).
Su `metadata.json` actual muestra una segunda conversión correcta con PyPdfiumBackend
(2026-11-11 15:48–15:49). **Estado actual:** artefactos completos (PP: 82/82 páginas, todas con
texto; FO: 64/64 páginas, 63 con texto, la restante es decorativa) y coherentes con la capa de texto
del PDF (PP 158.073 vs 158.711 caracteres; FO 82.091 vs 84.208). **No están incompletos.**
No existe log de esa segunda ejecución en `logs/`.

### 2.3 Archivos de medidas detalladas (análisis derivados por IA)

Esquema homogéneo en los nueve: cabecera de programa + 19 `bloques` canónicos (+ `otros_bloques`) con
medidas de 10 campos: `numero_medida`, `id_medida`, `seccion_original`, `id_bloque_comun`,
`titulo_bloque_comun`, `titulo_medida`, `texto_oficial`, `explicacion_medida`, `datos_a_favor`,
`datos_en_contra`. **Ninguna medida tiene campo de página ni de estado de revisión.**

| Partido | Medidas declaradas = reales = nombre archivo | Numeración | IDs duplicados | Bloques canónicos vacíos | `otros_bloques` | MD detallado ↔ JSON |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: |
| BNG | 492 | 1–492 continua | 0 | — | 0 | 492 = 492 |
| Coalición Canaria | 100 | 1–100 continua | 0 | — | 0 | 100 = 100 |
| Frente Obrero | 135 | 1–135 continua | 0 | 11, 18 | 0 | 135 = 135 |
| Iustitia Europa | 101 | 1–101 continua | 0 | 06, 11, 18 | 0 | 101 = 101 |
| EAJ-PNV | 225 | 1–225 continua | 0 | — | 0 | 225 = 225 |
| PP | 249 | 1–249 continua | 0 | — | 0 | 249 = 249 |
| Partido Humanista | 40 | 1–40 continua | 0 | 03, 06, 12, 13, 18 | 0 | 40 = 40 |
| Por Un Mundo Más Justo | 191 | 1–191 continua | 0 | — | 1 ("Protección y Bienestar Animal", 4 medidas) | 191 = 191 |
| SALF | 119 | 1–119 continua | 0 | 09, 11, 17, 18 | 0 | 119 = 119 |
| **Total** | **1.652** | | | | | |

- Coherencia interna correcta en los nueve: `total_medidas_bloque`, `medidas_incluidas` e
  `id_bloque_comun` coinciden con las medidas contenidas; ningún campo vacío.
- Los títulos de los 19 bloques canónicos son **idénticos** en los nueve archivos (taxonomía común
  reutilizable; ver `DATA_MODEL.md`).
- Los IDs heredados usan prefijos heterogéneos (`BNG-015`, `CCa-022`, `EAJ-PNV-205`, `M+J-001`,
  `FO-006`, …). `+` no es seguro en URL: se requieren IDs normalizados.
- Los MD detallados reproducen el JSON en formato legible (un encabezado `#### Medida N.` por medida).
  Son **redundantes** respecto al JSON; la aplicación no debe consumirlos.

### 2.4 Trazabilidad: `texto_oficial` frente al artefacto Docling

Cada `texto_oficial` se buscó en el texto del JSON Docling (normalizado: minúsculas, solo caracteres
alfanuméricos, incluyendo celdas de tabla). Categorías:

- **literal:** el texto completo aparece de forma contigua.
- **fragmentado:** inicio y final (40 caracteres) aparecen próximos, pero no contiguos (saltos de
  columna, viñetas, texto intercalado).
- **parcial:** solo aparece el inicio o el final.
- **no localizado:** no aparece.

| Partido | Literal | Fragmentado | Parcial | No localizado | Página candidata | Diagnóstico |
| :--- | ---: | ---: | ---: | ---: | ---: | :--- |
| BNG | 451 | 36 | 5 | 0 | 492/492 | Texto oficial en gallego |
| Coalición Canaria | 94 | 6 | 0 | 0 | 100/100 | |
| Frente Obrero | 129 | 0 | 4 | 2 | 133/135 | 6 `texto_oficial` llevan anotaciones añadidas `[Medida N del Capítulo …]` |
| Iustitia Europa | 95 | 6 | 0 | 0 | 101/101 | |
| EAJ-PNV | 225 | 0 | 0 | 0 | 225/225 | Mejor trazabilidad del corpus |
| PP | 230 | 6 | 5 | 8 | 241/249 | Los 8 no localizados son las medidas reservadas |
| Partido Humanista | **7** | 0 | 5 | **28** | 12/40 | `texto_oficial` **no literal** |
| Por Un Mundo Más Justo | 157 | 27 | 7 | 0 | 191/191 | `texto_oficial` agrega varios párrafos |
| SALF | **51** | 0 | 22 | **46** | 73/119 | `texto_oficial` **no literal** |
| **Total** | **1.439** | **81** | **48** | **84** | **1.568** | |

---

## 3. Hallazgos críticos

### H-1. `texto_oficial` no es literal en Partido Humanista y SALF (y contiene errores factuales)

Se contrastaron muestras con la capa de texto del PDF (pypdfium2), independiente de Docling:

| ID | `texto_oficial` (detallado) | PDF original |
| :--- | :--- | :--- |
| PH-002 | RBUI "con una cuantía inicial de **900 €** mensuales (equivalente al umbral de pobreza relativa)" | "asignación … de **950 €** al mes … (calculada en el **120 %** del umbral de pobreza…)" (p. 6) |
| PH-035 | Añade "Creación de organismos públicos de control democrático y auditoría de algoritmos…" | Esa frase **no aparece** en la sección 9 (p. 22) |
| SALF-029 | Sociedades: "10 % durante **cinco** años … Coste: ≈ **3.500** M€/año" | "10 % los **tres** primeros años … Coste: ≈ **6.000** M€/año" (p. 13; 3.500 M€ corresponde a otra medida) |
| SALF-037 | "blindado en la Constitución como derecho fundamental … (hoy, límite absurdo de 1.000 euros)" | "Derecho a pagar y cobrar en efectivo sin límite de importe: se deroga el tope de 1.000 euros…" (p. 15) |

Además, la numeración de SALF en el detallado (1–119) **no coincide** con la del PDF
(p. ej., SALF-029 = medida "5" de la sección III; SALF-037 = medida "13"). En Partido Humanista,
el PDF numera explícitamente "Propuesta 1…5" en una sección, mientras el detallado lista 40.

**Consecuencia:** el campo `texto_oficial` de estos dos partidos **no puede mostrarse como cita
literal** ni usarse para el comparador o la encuesta sin revisión manual completa.

### H-2. Contenido generado por IA sin fuentes en todos los detallados

`explicacion_medida`, `explicacion_bloque`, `datos_a_favor`, `datos_en_contra` y `nota_metodologica`
son texto generado por IA. Contienen cifras y afirmaciones atribuidas genéricamente (INE, Eurostat,
IGE…) **sin referencia verificable**, y en algunos casos interpretaciones que exceden el texto
oficial (p. ej., BNG-015 "transferir sin coste… de urgencia"). Los MD detallados incluyen además datos
contextuales no presentes en los PDF (p. ej., nombres de dirigentes). La asignación a bloque
canónico (`id_bloque_comun`) es también una clasificación derivada por IA.

### H-3. Medidas que no son propuestas

PP: medidas 83, 109, 132, 164, 167, 173, 200 y 210 figuran en el PDF como
"Permanezca atento a la campaña para conocer esta nueva medida" (verificado en pp. 34, 43, 48, 57,
58, 59, 65 y 67). El detallado las incluye con un `texto_oficial` parafraseado y "datos" analíticos.
**PP tiene 241 medidas con contenido**, no 249.

### H-4. Metadatos de programa no verificados

`fecha_publicacion`, `url_programa_oficial`, `web_oficial` y `titulo_programa` proceden de los
detallados (generados por IA). No constan en `metadata.json` ni hay registro de descarga.
Ejemplo a revisar: Iustitia Europa `fecha_publicacion = 2025-12-07`. Hasta su verificación deben
tratarse como "no verificado".

### H-5. Anotaciones dentro de `texto_oficial` (Frente Obrero)

Seis medidas añaden al texto literal una anotación entre corchetes
(`[Medida 1 del Capítulo 02 «Los trabajadores primero» …]`). Debe separarse del texto oficial.

### H-6. Cobertura temática desigual y efecto de la extracción

Varios partidos tienen bloques canónicos vacíos. Un bloque vacío significa
"**no se han localizado medidas clasificadas en este bloque en la extracción**", no
"el partido no tiene posición". Esto es crítico para el comparador (ver `PRD.md`, RF-COMP).

### H-7. Scripts y logs desactualizados

- `scripts/procesarTodo.ps1 -Force` **reprocesaría y sobrescribiría** los artefactos existentes; su
  comprobación "ya procesado" no verifica el hash. No debe ejecutarse sobre el corpus actual.
- `scripts/fallidos.ps1` apunta a una estructura antigua (PDF en la raíz, `_DIAGNOSTICO_DOCLING`) y a
  un ejecutable de una instalación local concreta. Histórico.
- `logs/` refleja la primera ejecución (ruta antigua `PROGRAMAS_ELECTORALES\conversion_logs`); no hay
  log de la reconversión de PP y FO.

### H-8. Repositorio

Git inicializado sin commits. Archivos grandes: `CoalicionCanaria_programa29N.pdf` (69 MB) y
`BNG_programa29N.json` (61 MB) superan el umbral de aviso de GitHub (50 MB). No existe `.gitignore`.

---

## 4. Estado por partido

Leyenda: **Disponible** (existe y es íntegro técnicamente) · **Disponible pero no validado** (existe,
coherente, sin revisión humana) · **Incompleto** · **Inválido** · **Pendiente de revisión manual**
(problemas detectados que impiden su uso sin revisión).

| Partido | PDF | Artefactos Docling | Detallado (estructura) | `texto_oficial` | Análisis IA | Metadatos programa | **Estado global** |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| BNG | Disponible | Disponible pero no validado | Disponible pero no validado | Disponible pero no validado (gallego) | Pendiente de revisión manual | No verificado | **Disponible pero no validado** |
| Coalición Canaria | Disponible | Disponible pero no validado | Disponible pero no validado | Disponible pero no validado | Pendiente de revisión manual | No verificado | **Disponible pero no validado** |
| Frente Obrero | Disponible | Disponible pero no validado | Disponible pero no validado | Disponible pero no validado (6 con anotaciones) | Pendiente de revisión manual | No verificado | **Disponible pero no validado** |
| Iustitia Europa | Disponible | Disponible pero no validado (TXT con `�`) | Disponible pero no validado | Disponible pero no validado | Pendiente de revisión manual | No verificado (fecha dudosa) | **Disponible pero no validado** |
| EAJ-PNV | Disponible | Disponible pero no validado | Disponible pero no validado | Disponible pero no validado (225/225 literal) | Pendiente de revisión manual | No verificado | **Disponible pero no validado** |
| PP | Disponible | Disponible pero no validado | Disponible pero no validado (8 reservadas) | Disponible pero no validado | Pendiente de revisión manual | No verificado | **Disponible pero no validado** |
| Partido Humanista | Disponible | Disponible pero no validado | Pendiente de revisión manual | **Pendiente de revisión manual** (33/40 no literales; errores) | Pendiente de revisión manual | No verificado | **Pendiente de revisión manual** |
| Por Un Mundo Más Justo | Disponible | Disponible pero no validado | Disponible pero no validado (1 bloque fuera de taxonomía) | Disponible pero no validado | Pendiente de revisión manual | No verificado | **Disponible pero no validado** |
| SALF | Disponible | Disponible pero no validado | Pendiente de revisión manual (numeración no oficial) | **Pendiente de revisión manual** (68/119 no literales; errores) | Pendiente de revisión manual | No verificado | **Pendiente de revisión manual** |

Ningún elemento se ha clasificado como **Inválido** o **Incompleto**: todos los archivos existen, son
sintácticamente válidos y cubren todas las páginas.

---

## 5. Recuentos: extraído, normalizado, revisado

| Nivel | Definición | Cantidad actual |
| :--- | :--- | ---: |
| Extraído | Registros en `*_medidas_detallado.json` | 1.652 |
| Con contenido | Extraído − medidas reservadas sin contenido | 1.644 |
| Localizado automáticamente | `texto_oficial` literal o fragmentado en Docling | 1.520 |
| Normalizado | Registros en el dataset de aplicación validado por esquema | 0 (pendiente, Fase 2) |
| Revisado | Registros con revisión humana registrada | 0 |
| Publicable como cita literal | Revisado y con evidencia verificada | 0 |

### Cómo se obtuvieron los datos

1. `scripts/auditar_corpus.py`: existencia, tamaños, SHA-256, validez JSON, páginas (pypdfium2 y
   Docling), coherencia de detallados y localización automática de `texto_oficial`.
2. Comprobaciones puntuales adicionales con la capa de texto de los PDF (pypdfium2) para PP
   (medidas reservadas), PH y SALF (discrepancias de §3). Son lecturas; no generan artefactos.

---

## 6. Implicaciones para la implementación

1. La aplicación debe consumir los detallados **solo** como fuente de estructura (lista de medidas,
   sección original, bloque propuesto) y de candidato de texto, nunca como verdad.
2. La evidencia (página + fragmento) se debe obtener del JSON de Docling y marcarse como
   *localizada automáticamente* hasta su revisión.
3. PH y SALF requieren remediación editorial antes de publicarse como citas (ver
   `IMPLEMENTATION_PLAN.md`, Fase 3).
4. Los campos de análisis IA no se muestran en el MVP.
5. Las 8 medidas reservadas del PP se conservan como registros con tipo `reservada` y no se
   cuentan como propuestas.
