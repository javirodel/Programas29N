# -*- coding: utf-8 -*-
"""Auditoría de SOLO LECTURA del corpus 29N (Fase 0).

No modifica pdfs_originales/ ni procesados/. Lee los PDF (hash, nº de páginas), los artefactos
Docling y los archivos *_medidas_detallado.json, y localiza cada texto_oficial en el JSON de
Docling (texto normalizado: minúsculas, solo caracteres alfanuméricos) para estimar trazabilidad.

Uso:  python scripts/auditar_corpus.py [ruta_salida.json]
Por defecto escribe docs/audit/audit_result.json. Requiere pypdfium2 (opcional, para nº de páginas).
"""
import json, glob, os, re, hashlib, unicodedata, collections, sys, bisect

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "docs", "audit", "audit_result.json")

try:
    import pypdfium2 as pdfium
except Exception:
    pdfium = None

def sha256(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for c in iter(lambda: f.read(1 << 20), b""):
            h.update(c)
    return h.hexdigest()

def norm(s):
    s = unicodedata.normalize("NFKC", s or "").lower()
    s = s.replace("\u00ad", "")
    return "".join(ch for ch in s if ch.isalnum())

def build_index(doc):
    """Concatena textos de Docling (texts + celdas de tablas) en orden, con mapa offset->página."""
    parts = []  # (norm_text, page)
    for t in doc.get("texts", []):
        pg = t["prov"][0]["page_no"] if t.get("prov") else None
        parts.append((norm(t.get("text", "")), pg))
    for tb in doc.get("tables", []):
        pg = tb["prov"][0]["page_no"] if tb.get("prov") else None
        for c in (tb.get("data") or {}).get("table_cells", []):
            parts.append((norm(c.get("text", "")), pg))
    starts, pages, buf, off = [], [], [], 0
    for txt, pg in parts:
        if not txt:
            continue
        starts.append(off); pages.append(pg); buf.append(txt); off += len(txt)
    return "".join(buf), starts, pages

def page_at(starts, pages, off):
    i = bisect.bisect_right(starts, off) - 1
    return pages[i] if i >= 0 else None

def locate(full, starts, pages, txt):
    n = norm(txt)
    if not n:
        return "vacio", []
    i = full.find(n)
    if i >= 0:
        return "literal", sorted({p for p in (page_at(starts, pages, i), page_at(starts, pages, i + len(n) - 1)) if p})
    k = 40
    if len(n) > 2 * k:
        a = full.find(n[:k]); b = full.find(n[-k:])
        if a >= 0 and b >= 0 and 0 <= b - a < len(n) * 3:
            return "fragmentado", sorted({p for p in (page_at(starts, pages, a), page_at(starts, pages, b)) if p})
        if a >= 0 or b >= 0:
            pos = a if a >= 0 else b
            return "parcial", [page_at(starts, pages, pos)]
    else:
        a = full.find(n[: max(15, len(n) // 2)])
        if a >= 0:
            return "parcial", [page_at(starts, pages, a)]
    return "no_encontrado", []

results = []
canon_titles = {}
for pdf in sorted(glob.glob(os.path.join(ROOT, "pdfs_originales", "*.pdf"))):
    base = os.path.splitext(os.path.basename(pdf))[0]
    d = os.path.join(ROOT, "procesados", base)
    r = {"id": base, "pdf": {"existe": True, "bytes": os.path.getsize(pdf)}}
    r["pdf"]["sha256"] = sha256(pdf)
    if pdfium:
        try:
            doc = pdfium.PdfDocument(pdf)
            r["pdf"]["paginas"] = len(doc)
            doc.close()
        except Exception as e:
            r["pdf"]["paginas_error"] = str(e)
    files = {}
    for ext in ("md", "json", "txt"):
        p = os.path.join(d, f"{base}.{ext}")
        files[ext] = {"existe": os.path.exists(p), "bytes": os.path.getsize(p) if os.path.exists(p) else 0}
    r["docling"] = files
    # metadata
    mp = os.path.join(d, "metadata.json")
    if os.path.exists(mp):
        m = json.load(open(mp, encoding="utf-8-sig"))
        r["metadata"] = {"existe": True, "sha256_meta": m.get("sha256"), "herramienta": m.get("herramienta"),
                         "fecha": m.get("fecha_procesamiento"), "archivo_original": m.get("archivo_original"),
                         "paginas_meta": m.get("paginas"), "claves": list(m.keys())}
        r["metadata"]["sha_coincide"] = (m.get("sha256") or "").lower() == r["pdf"]["sha256"]
        tb = m.get("tamano_bytes")
        if tb:
            r["metadata"]["tamanos_coinciden"] = all(tb.get(k) == (r["pdf"]["bytes"] if k == "pdf" else files[k]["bytes"]) for k in tb)
    else:
        r["metadata"] = {"existe": False}
    # docling json
    jp = os.path.join(d, f"{base}.json")
    full = starts = pages = None
    try:
        dj = json.load(open(jp, encoding="utf-8"))
        r["docling"]["json_valido"] = True
        r["docling"]["schema_name"] = dj.get("schema_name"); r["docling"]["version"] = dj.get("version")
        r["docling"]["paginas"] = len(dj.get("pages", {}))
        texts = dj.get("texts", [])
        r["docling"]["n_texts"] = len(texts); r["docling"]["n_tables"] = len(dj.get("tables", []))
        r["docling"]["n_pictures"] = len(dj.get("pictures", []))
        pg_chars = collections.Counter()
        for t in texts:
            if t.get("prov"):
                pg_chars[t["prov"][0]["page_no"]] += len(t.get("text", ""))
        npg = r["docling"]["paginas"] or 1
        r["docling"]["paginas_con_texto"] = sum(1 for p in range(1, npg + 1) if pg_chars.get(p, 0) > 0)
        r["docling"]["paginas_texto_escaso_lt200"] = [p for p in range(1, npg + 1) if pg_chars.get(p, 0) < 200]
        r["docling"]["texts_con_prov"] = sum(1 for t in texts if t.get("prov"))
        full, starts, pages = build_index(dj)
        del dj
    except Exception as e:
        r["docling"]["json_valido"] = False; r["docling"]["json_error"] = str(e)[:300]
    # md / txt
    mdp = os.path.join(d, f"{base}.md")
    if os.path.exists(mdp):
        md = open(mdp, encoding="utf-8", errors="replace").read()
        r["docling"]["md_imagenes_embebidas_base64"] = md.count("data:image/")
        r["docling"]["md_placeholders_image"] = md.count("<!-- image -->")
        r["docling"]["md_headings"] = len(re.findall(r"^#{1,6} ", md, re.M))
        r["docling"]["md_chars_texto_aprox"] = len(re.sub(r"!\[[^\]]*\]\(data:image/[^)]*\)", "", md))
    txp = os.path.join(d, f"{base}.txt")
    if os.path.exists(txp):
        tx = open(txp, encoding="utf-8", errors="replace").read()
        r["docling"]["txt_chars"] = len(tx); r["docling"]["txt_replacement_chars"] = tx.count("\ufffd")
        r["docling"]["txt_glyph_artifacts"] = len(re.findall(r"GLYPH<|/uni[0-9A-F]{4}", tx))
    # detallado
    dets = glob.glob(os.path.join(d, f"{base}_*medidas_detallado.json"))
    detmd = glob.glob(os.path.join(d, f"{base}_*medidas_detallado.md"))
    r["detallado"] = {"json": [os.path.basename(x) for x in dets], "md": [os.path.basename(x) for x in detmd]}
    if dets:
        dd = json.load(open(dets[0], encoding="utf-8"))
        r["detallado"]["json_valido"] = True
        fn_n = int(re.search(r"_(\d+)medidas", dets[0]).group(1))
        allm, blocks_info = [], []
        for grp in ("bloques", "otros_bloques"):
            for b in dd.get(grp, []) or []:
                ms = b.get("medidas", [])
                canon_titles.setdefault(b.get("id_bloque"), collections.Counter())[b.get("titulo_bloque")] += 1 if grp == "bloques" else 0
                blocks_info.append({"grupo": grp, "id": b.get("id_bloque"), "titulo": b.get("titulo_bloque"),
                                    "declaradas": b.get("total_medidas_bloque"), "reales": len(ms),
                                    "incluidas_coinciden": sorted(b.get("medidas_incluidas") or []) == sorted(m.get("numero_medida") for m in ms),
                                    "id_bloque_comun_coherente": all(m.get("id_bloque_comun") == b.get("id_bloque") for m in ms) if grp == "bloques" else None})
                for m in ms:
                    allm.append(m)
        nums = [m.get("numero_medida") for m in allm]
        ids = [m.get("id_medida") for m in allm]
        r["detallado"].update({
            "nombre_partido": dd.get("nombre_partido"), "siglas": dd.get("siglas"), "titulo_programa": dd.get("titulo_programa"),
            "fecha_publicacion": dd.get("fecha_publicacion"), "url_programa_oficial": dd.get("url_programa_oficial"),
            "web_oficial": dd.get("web_oficial"),
            "total_medidas_declarado": dd.get("total_medidas"), "total_en_nombre_archivo": fn_n, "total_real": len(allm),
            "n_bloques": len(dd.get("bloques", [])), "n_otros_bloques": len(dd.get("otros_bloques") or []),
            "ids_duplicados": [k for k, v in collections.Counter(ids).items() if v > 1],
            "numeros_duplicados": [k for k, v in collections.Counter(nums).items() if v > 1],
            "rango_numeros": [min(nums), max(nums)] if nums else None,
            "huecos_numeracion": sorted(set(range(min(nums), max(nums) + 1)) - set(nums))[:50] if nums else None,
            "bloques_vacios": [b["id"] for b in blocks_info if b["reales"] == 0],
            "bloques_incoherentes": [b for b in blocks_info if b["declaradas"] != b["reales"] or not b["incluidas_coinciden"] or b["id_bloque_comun_coherente"] is False],
            "medidas_por_bloque": {b["id"]: b["reales"] for b in blocks_info},
            "campos_vacios": {k: sum(1 for m in allm if not str(m.get(k, "")).strip()) for k in ("titulo_medida", "texto_oficial", "explicacion_medida", "datos_a_favor", "datos_en_contra", "seccion_original")},
            "tiene_campo_pagina": any(any("pag" in k.lower() or "page" in k.lower() for k in m) for m in allm),
        })
        # md detallado: ids presentes
        if detmd:
            dmd = open(detmd[0], encoding="utf-8").read()
            r["detallado"]["md_ids_ausentes"] = [i for i in ids if i and i not in dmd][:20]
            r["detallado"]["md_n_ids_ausentes"] = sum(1 for i in ids if i and i not in dmd)
        # trazabilidad
        if full is not None:
            c = collections.Counter(); pagesfound = 0; samples = []
            for m in allm:
                st, pg = locate(full, starts, pages, m.get("texto_oficial", ""))
                c[st] += 1
                if pg: pagesfound += 1
                if st == "no_encontrado" and len(samples) < 3:
                    samples.append({"id": m.get("id_medida"), "texto": (m.get("texto_oficial") or "")[:160]})
            r["trazabilidad"] = {"resultado": dict(c), "con_pagina_localizable": pagesfound, "muestras_no_encontradas": samples}
    results.append(r)
    print(base, "ok", file=sys.stderr)

out = {"partidos": results, "titulos_bloques_canonicos": {k: dict(v) for k, v in canon_titles.items()}}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("escrito", OUT)

