# PRODUCT_BRIEF — Proyecto 29N

## 1. Visión y Propósito del Producto

El **Proyecto 29N** es una plataforma cívica digital, independiente y de código abierto, diseñada para permitir a la ciudadanía consultar, explorar y comparar de forma rigurosa, neutral y verificable las propuestas de los programas electorales de los partidos políticos concurrentes a las elecciones generales del 29 de noviembre (29N).

A diferencia de las coberturas mediáticas tradicionales o de herramientas de recomendación de voto opacas, el proyecto 29N se fundamenta en un principio cardinal: **trazabilidad documental absoluta**. Cada afirmación o propuesta indexada en la plataforma debe estar respaldada por una cita textual y una referencia exacta de página al documento oficial primario publicado por la respectiva formación política.

---

## 2. Problema y Oportunidad

### 2.1 El problema
- **Inaccesibilidad:** Los programas electorales se publican en extensos documentos PDF (a menudo de entre 40 y 100 páginas) de maquetación densa, lo que dificulta su lectura completa por parte del electorado.
- **Opacidad en comparaciones:** Las herramientas de afinidad ideológica o "brújulas electorales" suelen asignar posiciones ideológicas a los partidos mediante algoritmos de "caja negra" o cuestionarios subjetivos, sin permitir al usuario verificar el texto oficial que justifica dicha puntuación.
- **Sesgo y polarización:** El debate público tiende a basarse en declaraciones de campaña o titulares de prensa, dejando en un segundo plano los compromisos programáticos formales por escrito.

### 2.2 La propuesta de valor de 29N
- **Transparencia radical:** Acceso directo a las 1.652 medidas extraídas de los nueve programas oficiales, con visualización del texto oficial, la sección del programa y el visor del PDF original en la página exacta.
- **Comparador temático neutral:** Herramienta para contrastar las posturas de entre 2 y 4 formaciones políticas sobre 19 áreas temáticas canónicas (vivienda, empleo, fiscalidad, educación, sanidad, etc.), sin inventar equivalencias artificiales y señalando explícitamente la ausencia de propuestas en un tema.
- **Test de afinidad fundamentado y privado:** Cuestionario de orientación temática cuyas respuestas se calculan en local (en el navegador del usuario) y donde cada coincidencia o discrepancia con un partido enlaza directamente a la evidencia programática que la sustenta.

---

## 3. Público Objetivo (Personas de Usuario)

1. **El ciudadano indeciso o contrastador:** Busca conocer qué propone cada formación sobre temas concretos (ej. vivienda para jóvenes, fiscalidad o autónomos) de forma rápida y sin ruido mediático.
2. **El periodista o verificador (fact-checker):** Requiere una herramienta ágil para cotejar afirmaciones de mítines y debates con los textos oficiales y acceder al enlace de la página exacta del PDF original.
3. **El investigador de ciencias políticas o analista de políticas públicas:** Precisa de un corpus documental homogéneo, estructurado y contrastado sobre el que realizar estudios comparativos sectoriales.

---

## 4. Principios Editoriales y Metodológicos

1. **Fidelidad al documento fuente:** El partido político es el único autor de su programa. La plataforma no redacta ni interpreta intenciones no escritas.
2. **Neutralidad de presentación:** Todas las formaciones tienen el mismo peso estructural y visual en el catálogo y los comparadores. El orden por defecto es alfabético o neutro.
3. **Distinción inequívoca entre texto y análisis:**
   - El texto oficial se muestra con la máxima fidelidad y preservando su idioma original (p. ej. gallego en el BNG).
   - Los textos derivados o generados por inteligencia artificial se identifican explícitamente y se someten a control de calidad humano antes de su divulgación pública.
4. **Distinción entre posición, insuficiencia y ausencia:**
   - La ausencia de mención a una materia en un programa electoral nunca se equipara a una postura contraria o negativa. Se etiqueta con transparencia como *"Sin referencia en el programa"*.
5. **Privacidad por diseño (Local-First):** Las respuestas al test de afinidad ideológica nunca se transmiten a servidores externos ni se vinculan a perfiles de usuario. Ningún dato de opinión política es almacenado.
6. **No recomendación de voto:** La plataforma jamás emite un veredicto de "a quién votar". Muestra únicamente grados de coincidencia matemática sobre las afirmaciones evaluadas.

---

## 5. Alcance: MVP vs. Roadmap

### 5.1 Alcance MVP (Fase 1 a 6)
- **Catálogo de programas:** Vista general de los 9 partidos con fichas informativas, enlace de descarga al PDF original inmutable y metadatos de extracción.
- **Visor individual de programas:** Navegación por bloques temáticos y lista de propuestas con cita textual, sección original, indicador de calidad de extracción y enlace modal o directo a la página del PDF.
- **Comparador multipartido (2 a 4 partidos):** Vista matricial por bloques canónicos alineados, destacando propuestas publicadas y ausencias documentadas.
- **Buscador global:** Búsqueda textual sobre las propuestas del corpus con filtros por partido y bloque temático.
- **Test de afinidad (Modo 5 minutos):** Banco de preguntas clave con respuestas en escala Likert, cálculo local-first y desglose de coincidencias basado en propuestas contrastadas.
- **Páginas metodológicas e institucionales:** Metodología detallada, estado de auditoría del corpus, créditos, política de privacidad y descargo de responsabilidad.
- **Cumplimiento de accesibilidad:** Certificación WCAG 2.2 Nivel AA y diseño responsive móvil/escritorio.

### 5.2 Roadmap Posterior (Fuera de MVP)
- Módulo de administración y edición colaborativa con control de cambios y roles.
- Búsqueda semántica mediante embeddings vectoriales.
- Banco ampliado para el test de afinidad (modos 10 y 15 minutos).
- Mapas interactivos de compromisos autonómicos/territoriales.
- Exportación personalizada de comparativas en PDF/CSV.
- Módulo de seguimiento posterior de cumplimiento electoral (observatorio de legislatura).

---

## 6. Métricas de Éxito del Producto

- **Rigor de datos:** 100% de las propuestas publicadas en el catálogo deben contar con página y evidencia localizada del PDF original.
- **Rendimiento:** Puntuación Lighthouse ≥ 90 en Rendimiento, Accesibilidad, Buenas Prácticas y SEO. Tiempo de primera interacción (INP) < 200 ms.
- **Accesibilidad:** Cero violaciones detectadas en auditorías automatizadas `axe-core` y contraste superior a 4.5:1 en todos los componentes tipográficos.
- **Neutralidad verificable:** Auditoría técnica pública de todos los algoritmos de afinidad y esquemas de datos abiertos.
