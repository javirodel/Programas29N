#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de extracción de PDF a Markdown, JSON y Texto plano usando Docling
con backend PyPdfium para máxima estabilidad en Windows.
"""

import os
import sys
import time
import json
import hashlib
from pathlib import Path

from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.base_models import InputFormat
from docling.backend.pypdfium2_backend import PyPdfiumDocumentBackend


def sha256_file(filepath):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def convert_pdf_to_ai_formats(pdf_path, output_dir, base_name, force=False):
    pdf_path = Path(pdf_path).resolve()
    output_dir = Path(output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    md_path = output_dir / f"{base_name}.md"
    json_path = output_dir / f"{base_name}.json"
    txt_path = output_dir / f"{base_name}.txt"
    meta_path = output_dir / "metadata.json"

    file_hash = sha256_file(pdf_path)

    # Comprobar si ya existe y está completo
    if not force and md_path.exists() and json_path.exists() and txt_path.exists() and meta_path.exists():
        if md_path.stat().st_size > 0 and json_path.stat().st_size > 0 and txt_path.stat().st_size > 0:
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    meta_data = json.load(f)
                if meta_data.get("sha256") == file_hash:
                    print(f"[OMITIDO] {base_name} ya está procesado y el hash coincide.")
                    return True
            except Exception:
                pass

    print(f"\n[INICIANDO] Procesando {pdf_path.name} -> {base_name}...")
    t0 = time.time()

    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(backend=PyPdfiumDocumentBackend)
        }
    )

    try:
        result = converter.convert(str(pdf_path))
        elapsed = round(time.time() - t0, 2)
        print(f"[OK] Conversión completada en {elapsed}s. Guardando archivos...")

        # 1. Guardar Markdown
        result.document.save_as_markdown(md_path)

        # 2. Guardar JSON
        result.document.save_as_json(json_path)

        # 3. Guardar Texto plano
        txt_content = result.document.export_to_text()
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(txt_content)

        # 4. Guardar Metadata
        num_pages = len(result.document.pages) if hasattr(result.document, "pages") else None
        meta = {
            "archivo_original": pdf_path.name,
            "nombre": base_name,
            "sha256": file_hash,
            "fecha_procesamiento": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            "herramienta": "Docling (PyPdfiumBackend)",
            "formatos": ["md", "json", "txt"],
            "paginas": num_pages,
            "duracion_segundos": elapsed,
            "tamano_bytes": {
                "pdf": pdf_path.stat().st_size,
                "md": md_path.stat().st_size,
                "json": json_path.stat().st_size,
                "txt": txt_path.stat().st_size
            }
        }
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2, ensure_ascii=False)

        print(f"[EXITO] {base_name} procesado correctamente:")
        print(f"  - Markdown: {md_path.name} ({md_path.stat().st_size:,} bytes)")
        print(f"  - JSON:     {json_path.name} ({json_path.stat().st_size:,} bytes)")
        print(f"  - TXT:      {txt_path.name} ({txt_path.stat().st_size:,} bytes)")
        return True

    except Exception as e:
        print(f"[ERROR] Error procesando {pdf_path.name}: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Uso: python convertir_docling.py <archivo_pdf> <carpeta_salida> <nombre_base> [--force]")
        sys.exit(1)

    pdf_in = sys.argv[1]
    out_dir = sys.argv[2]
    name_base = sys.argv[3]
    force_run = "--force" in sys.argv

    success = convert_pdf_to_ai_formats(pdf_in, out_dir, name_base, force=force_run)
    sys.exit(0 if success else 1)
