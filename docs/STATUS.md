# STATUS.md — Estado Actual del Proyecto 29N

> **Última actualización:** 2026-11-19
> **Fase completada:** Incorporación aditiva de **4 candidaturas extraparlamentarias proclamadas en el BOE (`BOE-A-2026-23103`) con programa oficial 29N en PDF** (**Geroa Bai**, **Partido Autónomos**, **Unidad del Pueblo Canario** y **Partido Feministas al Congreso**), elevando el corpus auditado a **26 candidaturas oficiales en PDF** (**7.934** medidas extraídas / **7.926** publicables), tras la incorporación previa de **Junts per Catalunya** y el endurecimiento de `/api/contact`. Queda únicamente **UPN** (en coalición Navarra con el PP vía `upn-pp.es`) del Congreso saliente sin PDF programático autónomo separado.
> **Estado de compilación y calidad:** `auditar_corpus.py`, `data:build`, `format:check`, `typecheck`, `lint`, `test` (12/12) y `build` en verde.

---

## 1. Resumen del Corpus y Cobertura Electoral

Resultado del último `npm run data:build` (compilación verificada frente a `pdfs_originales/` y `procesados/`):

- **Programas oficiales en PDF verificados (SHA-256):** 26 / 26 (`ok` en `scripts/auditar_corpus.py`):
  - **Integrados en fases previas (22):** Adelante Andalucía (719), BNG (492, `gl`), Coalición Canaria (100), Compromís - Front Valencià (561, `ca`), EH Bildu (185), ERC (227, `ca`), Falange Española de las JONS (260), Frente Amplio · Sumar (908), Frente Obrero (135), Iustitia Europa (101), Junts per Catalunya (613, `ca`), PACMA (400), Partido Humanista (40), PNV (225), Podemos (442), Por un Mundo Más Justo (191), PP (249 extraídas / 241 publicables + 8 reservadas), PSOE (500), SALF (119), Soria ¡YA! (22), Teruel Existe (140), VOX (115).
  - **Incorporados aditivamente tras revisión BOE (4):** Geroa Bai (`geroa-bai`, 16 medidas, 14 págs., Navarra), Partido Autónomos (`partido-autonomos`, 100 medidas, 15 págs., Alicante/Castellón/Valencia/S. C. Tenerife), Partido Feministas al Congreso (`pfac`, 1.056 medidas, 170 págs., Álava y Bizkaia) y Unidad del Pueblo Canario (`upc`, 18 medidas, 6 págs., Canarias).
- **Otras candidaturas proclamadas (`BOE-A-2026-23103`) revisadas sin PDF 29N publicado:** UPN (coalición Navarra con PP sin programa autónomo separado), PCTE, Escaños en Blanco, Alhora, Drago Canarias, Liberación Canaria y listas menores provinciales sin programa 29N publicado en PDF.
- **Medidas extraídas:** 7.934
- **Medidas publicables:** 7.926
- **Medidas verificadas frente al PDF / trazabilidad de encuesta y maquetación:** 1.253 (incluye los 500 compromisos del PSOE, 84 medidas con evidencia explícita multi-columna de Teruel Existe, todas las evidencias citadas en encuesta de los 26 partidos, las 22 medidas con salto de página de PFAC, las 3 medidas con salto de página de Podemos y las subsanaciones previas de `bng`, `pp` y `por-un-mundo-mas-justo`).
- **Medidas en revisión pendiente (`requiere_revision`):** 0
- **Huecos reservados de campaña (`reservada`):** 8 (`pp-083`, `pp-109`, `pp-132`, `pp-164`, `pp-167`, `pp-173`, `pp-200`, `pp-210`)
- **Preguntas de encuesta (`5min`):** 15 (codificadas para las 26 candidaturas con PDF oficial publicado, respetando explícitamente `sin_referencia` e `insuficiente` ante silencios programáticos)

---

## 2. Cambios Principales Realizados para Lanzamiento

1. **Integración completa de los 6 nuevos programas (1.883 medidas nuevas):**
   - Extracción literal desde sus documentos PDF/Docling (`PSOE`, `Compromís`, `PACMA`, `Falange`, `Teruel Existe` y `Soria ¡YA!`), preservando el valenciano en `Compromís` y evitando arrastres de barras laterales o cabeceras repetidas.
   - Análisis individualizado por medida (`titulo_medida`, `explicacion_medida`, `datos_a_favor` y `datos_en_contra` concretos y neutrales) e inclusión en los `*_detallado.{json,md}` y `data/reviews/*.json`.
   - Subsanación de las 16 medidas previas que figuraban en `requiere_revision` (`bng`, `pp` y `por-un-mundo-mas-justo`), eliminación de `bng.factcheck-part4.json` duplicado y sustitución del único enlace roto detectado en `data/annotations/adelante-andalucia.part6.json` (`adelante-andalucia-610`).
2. **Eliminación de referencias públicas a «verificación humana» y jerga interna:**
   - Retirado el filtro `onlyVerified` (`estado=verificada`) de `SearchExplorer`, `/buscar` y `/api/search`.
   - Reescrita `/metodologia` como **«Cómo funciona 29N · Fuentes y metodología»** en lenguaje ciudadano claro (criterio de inclusión, fidelidad PDF SHA-256, desplegable independiente «A favor y en contra», silencio en el test y listado de Congreso saliente pendiente).
   - Añadido enlace directo a «Cómo funciona» en `NavBar` y actualizado el pie de página global.
3. **Pulido funcional de UI:**
   - **Catálogo (`/programas` e `/`):** pestañas rápidas (`Todos con programa`, `Congreso saliente`, `Ámbito estatal`, `Autonómicos y provinciales`), insignias de escaños del Congreso saliente y territorio, y sección transparente para las 5 formaciones del Congreso saliente pendientes de publicar programa con fichas dedicadas en `/programas/[partyId]`.
   - **Visor (`/programas/[partyId]` y `EvidenceModal`):** anclas `#medida-[id]` con desplazamiento/resaltado automático al abrir enlaces profundos y botón **«Copiar enlace»**.
   - **Comparador (`/comparar`):** selector por defecto inicializado a `PSOE · PP · VOX`, botones de comparativas rápidas y buscador de texto dentro del modo «Medidas por bloque».
   - **Buscador (`/buscar`):** chips de temas frecuentes, submenú de filtros plegable/desplegable fijo al hacer scroll y acceso directo a **«Ver cita documental»** (`EvidenceModal`).
   - **Visor (`/programas/[partyId]`):** barra sticky superior para desplegar/ocultar el índice de temas sin volver arriba.
   - **Test de afinidad (`/encuesta`):** pantalla introductoria resumida y profesional, filtro entre todas las candidaturas y solo ámbito estatal, botón **«Copiar resumen de mis resultados»** y enlace directo **«Comparar mis 3 partidos más afines →»**.
   - **Inicio (`/`):** transición fundida progresiva (`CongressHemicycle`), hemiciclo interactivo del Congreso saliente (350 escaños en 9 arcos) con popup por bloque parlamentario hacia `/programas/[partyId]`, `/comparar`, `/buscar` y PDF oficial, más sección completa **«Otras candidaturas del 29N»**.
   - **Comparador (`/comparar`):** flujo continuo estilo comparativa de producto con selectores `sticky`, sección **Resumen** primero (cifras clave y 15 ejes) y **Desglose detallado por bloque** a continuación.
4. **Limpieza, licencias, seguridad y respaldo para producción:**
   - Eliminados archivos temporales/obsoletos (`promt.md`, `logs/`, `scripts/fallidos.ps1`, `tools/data/resolve-urls.ts`, `tsconfig.tsbuildinfo`).
   - Añadidos `LICENSE` (MIT para código con atribución explícita de PDFs oficiales), `README.md` actualizado, páginas `/privacidad` y `/aviso-legal` (con manifiesto de respaldo SHA-256), `/api/audit` actualizado a `.generated/reports/coverage-report.json`, cabeceras HTTP de seguridad en `next.config.ts` (`Strict-Transport-Security`, `X-DNS-Prefetch-Control`, `Cross-Origin-Opener-Policy`) y pie de página editorial de 3 líneas en `src/app/layout.tsx`.

5. **Equilibrio editorial y simplificación progresiva («término medio»):**
   - **Inicio (`/`):** cabecera editorial propia con buscador en caja definida (`HeroQuestionSearch`), hemiciclo interactivo con doble modo (`Explorar programas` y `Simulador de mayorías (176 escaños)` con presets), sección plegable de **«Otras candidaturas del 29N»** y explorador por 6 ejes + rejilla de bloques (`HomeTopicSpotlight`).
   - **Navegación (`NavBar`):** etiquetas propias (`Programas`, `Comparador`, `Test 5 min`, `Buscador`, `Vocabulario`, `Metodología`) y subrayado activo sólido.
   - **Comparador (`/comparar`):** cuestiones clave en filas comparativas de lectura rápida (solo las 2 primeras citas expandidas por defecto + conmutador `Desplegar todas las citas`) y límite inicial de 4 propuestas por columna en bloques temáticos.
   - **Programas (`/programas` y `/programas/[partyId]`):** catálogo en rejilla compacta de 2 columnas con chips de temas principales; ficha de partido equilibrada en 2 columnas de síntesis superior y visor con solo los 2 primeros bloques abiertos por defecto (4 medidas por bloque) y apertura progresiva.
   - **Buscador (`/buscar`):** panel de filtros plegado por defecto en entrada limpia, paginación progresiva (`8` resultados iniciales + `Mostrar 10 resultados más`) y recorte de textos largos con expansión en línea.
   - **Capa cinética (`tokens.css` y `ScrollReveal.tsx`):** `.home-hero-stage`, `.majority-progress-fill`, `startViewTransition`, `.animate-panel-switch`, `.scroll-reveal`, `.bar-grow`, ola radial del hemiciclo y respeto a `prefers-reduced-motion`.

6. **Corrección integral de scroll, hemiciclo estable y portada con personalidad propia:**
   - **Scroll fluido sin secuestros (`tokens.css`, `ScrollReveal.tsx`, `ProgramViewer.tsx`, `ComparatorView.tsx`, `ProgramCatalog.tsx`):** reemplazado `scrollIntoView` en los carriles horizontales del scrollspy por desplazamiento horizontal exclusivo (`rail.scrollTo`), ajustados umbrales de `ScrollReveal` (`threshold: 0.01`, `rootMargin: "0px 0px 40px 0px"`), simplificadas las reglas sticky y mantenidos todos los bloques del visor de partido abiertos por defecto con `3` medidas iniciales (`220` caracteres) por bloque para lectura continua sin saltos.
   - **Hemiciclo estable en 2 columnas (`CongressHemicycle.tsx`):** inspector lateral siempre visible (inicia en `PP`, con fijación por clic y minigráfico de los 3 bloques principales) que evita por completo los saltos verticales de página al mover el cursor, acompañado del **Pactómetro (176 escaños)** multicolor con escenarios rápidos y filtro por ámbito en **«Otras candidaturas del 29N»**.
   - **Portada única y Termómetro de los debates (`src/app/page.tsx`, `HeroQuestionSearch.tsx`, `HomeTopicSpotlight.tsx`):** nueva cabecera editorial («Todo lo que prometen para el 29N, frente a frente y sin letra pequeña»), 3 accesos rápidos bajo el buscador y espectro visual en 3 columnas (`En contra`, `Neutro o sin referencia`, `A favor`) para visualizar cada debate al instante.

   - **Comparador emparejado fila por fila (`ComparatorView.tsx`):** cabecera editorial unificada con la portada (`/`), fila visible de tarjetas de los partidos en pantalla con selector plegable, conmutador claro en 2 modos (`15 debates clave` vs. `Medidas por bloque temático`) y cuadrícula horizontal emparejada fila a fila con alturas alineadas, paginación progresiva (`4` filas iniciales) y celdas de contraste cuando un partido termina antes su bloque.

7. **Laboratorio interactivo de Vocabulario y Estadísticas (`/estadisticas`):**
   - **Métricas ampliadas del corpus (`stats.ts`, `repository.ts`):** añadidas `avgWordsPerProposal`, `uniqueTermCount`, `topThreeConcentrationPct`, `topFrequentTerms`, reparto en 4 grandes áreas (`macroAreas`) y el motor `computeConceptRadar` con 16 conceptos clave multilingües (`es`/`ca`/`gl`).
   - **Explorador interactivo en 3 pestañas (`VocabularyStatsExplorer.tsx` y `src/app/estadisticas/page.tsx`):** radar de conceptos ordenable por menciones totales o tasa por cada 100 medidas, huella léxica conmutando TF-IDF vs. más repetidas + filtros por ámbito, radiografía de prioridades por 4 áreas + índice de especialización y comparativa ordenable de extensión, densidad y estilo.

8. **Pulido final de navegación, Test de afinidad, transparencia PDF y limpieza:**
   - **Navegación (`NavBar.tsx`):** etiqueta corregida a `"Test de afinidad"` con `whitespace-nowrap shrink-0` para impedir saltos de línea.
   - **Botón global de subida y transiciones (`ScrollToTopButton.tsx`, `layout.tsx`, `tokens.css`):** botón flotante animado con indicador de porcentaje y desplazamiento suave arriba, junto a curvas de fundido mejoradas (`.animate-panel-switch` y `.fade-lift-in`).
   - **Test (`/encuesta`, `SurveyClient.tsx`):** cabecera unificada, pasos rápidos `1..15`, opciones en 2 columnas compactas para reducir el scroll vertical, avance suave y retorno automático arriba (`scrollToSurveyTop`).
   - **Transparencia exacta frente al PDF (`programas/[partyId]/page.tsx`, `metodologia/page.tsx`, `aviso-legal/page.tsx`):** aclaración explícita en el caso del **PP** (`241` publicables de `249` numeradas en PDF, `8` reservadas en campaña) y auditoría verificada con `python scripts/auditar_corpus.py`.
   - **Limpieza (`tsconfig.json`, `package.json`):** desactivado `incremental` para evitar regenerar `tsconfig.tsbuildinfo` y eliminados 4 scripts auxiliares obsoletos (`export-review-batches.ts`, `validate-factcheck.ts`, `check-annotation-sources.ts`, `export-schema.ts`).

9. **Ampliación aditiva con Sumar / Frente Amplio y EH Bildu (`20` programas en PDF):**
   - Descarga y procesamiento Docling N1 estrictamente aditivos en `pdfs_originales/` y `procesados/` de `FrenteAmplio_programa29N` (151 págs., 908 medidas) y `EHBildu_programa29N` (30 págs., 185 medidas).
   - Emisión completa N2 (`*_medidas_detallado.{json,md}`), overlays N3 verificados (`data/reviews/{frente-amplio,eh-bildu}.json`), registro en `data/registry/documents.json`, codificación de las 15 cuestiones en `data/survey/questions.json`, promoción a `PARTY_META` en `party-colors.ts` (quedando solo `Junts`, `Podemos` y `UPN` como Congreso saliente sin programa autónomo) y actualización de esquema y tests (`5.689` extraídas / `5.681` publicables).

10. **Ampliación aditiva con Podemos (`21` programas en PDF):**
    - Descarga y procesamiento Docling (`PyPdfiumBackend`) aditivo de `Podemos_programa29N` (`29N-programa-Podemos.-Paz-casa-y-trabajo.pdf`, 141 págs., 442 medidas).
    - Emisión completa N2 (`Podemos_programa29N_442medidas_detallado.{json,md}`), overlay N3 verificado (`data/reviews/podemos.json` con citas de encuesta y las 3 medidas con salto de página), registro en `data/registry/documents.json`, codificación de las 15 cuestiones en `data/survey/questions.json`, promoción de `podemos` a `PARTY_META` en `party-colors.ts` (quedando solo `Junts` y `UPN` pendientes de PDF autónomo) y actualización de esquema, textos públicos (`layout.tsx`, `aviso-legal`, `buscar`, `estadisticas`, `README.md`) y tests (`6.131` extraídas / `6.123` publicables).

11. **Ampliación aditiva con Junts per Catalunya (`22` programas en PDF) y seguridad en `/api/contact`:**
    - Descarga y procesamiento Docling (`PyPdfiumBackend`) aditivo de `Junts_programa29N` (`PROGRAMA-ELECTORAL_JUNTS_29N.pdf` desde `tualcentre.cat`, 90 págs., 613 medidas en catalán original `ca`).
    - Emisión completa N2 (`Junts_programa29N_613medidas_detallado.{json,md}`), overlay N3 verificado (`data/reviews/junts.json` con 34 medidas citadas en encuesta), registro en `data/registry/documents.json`, codificación de las 15 cuestiones en `data/survey/questions.json`, promoción de `junts` a `PARTY_META` en `party-colors.ts` (quedando únicamente `UPN` pendiente en coalición Navarra con PP) y actualización de esquema, textos públicos y tests (`6.744` extraídas / `6.736` publicables).
    - Endurecimiento de `src/app/api/contact/route.ts` con validación de `Origin`, `escapeForSafeDisplay` y guardado automático en GitHub Issues vía `GITHUB_CONTACT_TOKEN`.

12. **Ampliación aditiva tras búsqueda integral en candidaturas BOE (`26` programas en PDF):**
    - Revisadas las candidaturas proclamadas en `BOE-A-2026-23103` más allá del Congreso saliente; descarga y procesamiento Docling (`PyPdfiumBackend`) aditivo de **Geroa Bai** (`GeroaBai_programa29N`, 14 págs., 16 medidas), **Partido Autónomos** (`PartidoAutonomos_programa29N`, 15 págs., 100 medidas), **Unidad del Pueblo Canario** (`UPC_programa29N`, 6 págs., 18 medidas) y **Partido Feministas al Congreso** (`PFAC_programa29N`, 170 págs., 1.056 medidas).
    - Emisión completa N2 (`*_medidas_detallado.{json,md}`), overlays N3 verificados (`data/reviews/{geroa-bai,partido-autonomos,upc,pfac}.json` con todas las citas de encuesta y las 22 medidas con salto de página de PFAC), registro en `data/registry/documents.json`, codificación de las 15 cuestiones en `data/survey/questions.json`, paleta WCAG AA y ámbito territorial en `party-colors.ts`, flexibilización del patrón de ID en `schema.ts` y actualización de textos públicos y tests (`7.934` extraídas / `7.926` publicables / `1.253` verificadas / `0` en revisión).

---

## 3. Verificaciones Ejecutadas Tras los Últimos Cambios

- `python scripts/auditar_corpus.py` — OK (`26/26` documentos `ok`, 0 campos vacíos, 0 bloques incoherentes)
- `npm run format:check` — OK
- `npm run typecheck` (`tsc --noEmit`) — OK
- `npm run lint` (`eslint .` con `eslint-plugin-jsx-a11y`) — OK (0 errores, 0 avisos)
- `npm run data:build` — OK (`26/26 SHA-256 verificados | extraídas: 7934 | publicables: 7926 | verificadas/corregidas: 1253 | en revisión: 0 | reservadas/rechazadas: 8 | preguntas encuesta: 15`)
- `npm test` (`node --test "tests/**/*.test.ts"`) — OK (`12/12` tests superados, `0` fallos, `0` omitidos)
- `npm run build` (`next build`) — OK (compilación completa sin errores)
