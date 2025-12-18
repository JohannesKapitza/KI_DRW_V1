import json
import re
from pathlib import Path

# --- CONFIG (Windows) ---
SCRATCH_DIR = Path(r"scratch")

# Your GER -> (output key) mapping.
# I use snake_case keys because it’s easier in code/JSON;
# you can rename them to your exact title-block field IDs later.
GER_TO_KEY = {
    "CAD System": "cad_system",
    "Abteilung": "department",
    "Name Zeichnungsverantwortlicher": "drawing_manager_name",
    "Telefonnummer Zeichnungsverantwortlicher": "drawing_manager_phone",
    "Projekt": "project",
    "Werkstoff": "material",
    "Gewicht": "weight",
    "Halbzeug": "semi_finished_product",
    "Format Zeichnungsblatt": "drawing_sheet_format",
    "Oberflächenschutz": "surface_protection",
    "Blattnummer": "sheet_number",
    "Blattanzahl": "number_of_sheets",
    "Benennung": "designation",
    "Teilenummer": "part_number",
    "Maßstab": "scale",
}

# Optional: only extract from this sheet name if you want to lock it down.
PREFERRED_SHEET_PREFIX = "sheet: V1.0"  # set to None to allow any body sheet

# --- helpers ---
def norm(s: str) -> str:
    s = (s or "").replace("\u00a0", " ")
    s = re.sub(r"\s+", " ", s).strip().lower()
    return s

def overlaps_1d(a1, a2, b1, b2) -> float:
    """Return overlap length in 1D intervals."""
    left = max(a1, b1)
    right = min(a2, b2)
    return max(0.0, right - left)

def pick_docling_json(scratch: Path) -> Path:
    # Pick newest .json in scratch that looks like a DoclingDocument
    candidates = sorted(scratch.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
    for p in candidates:
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            if data.get("schema_name") == "DoclingDocument":
                return p
        except Exception:
            continue
    raise FileNotFoundError("No DoclingDocument JSON found in scratch/")

def build_group_map(doc):
    group_map = {}
    for g in doc.get("groups", []):
        group_map[g["self_ref"]] = {
            "name": g.get("name", ""),
            "content_layer": g.get("content_layer", ""),
        }
    return group_map

def iter_cells(doc):
    group_map = build_group_map(doc)
    for t_idx, t in enumerate(doc.get("tables", [])):
        parent_ref = (t.get("parent") or {}).get("$ref")
        group = group_map.get(parent_ref, {})
        sheet_name = group.get("name", "unknown")
        layer = group.get("content_layer", t.get("content_layer", ""))

        # Only body (ignore invisible sheets/regions)
        if layer != "body":
            continue
        if PREFERRED_SHEET_PREFIX and not sheet_name.startswith(PREFERRED_SHEET_PREFIX):
            continue

        prov0 = (t.get("prov") or [{}])[0]
        bbox = prov0.get("bbox") or {}
        tl = float(bbox.get("l", 0.0))
        tt = float(bbox.get("t", 0.0))

        grid = ((t.get("data") or {}).get("grid")) or []
        for r, row in enumerate(grid):
            for c, cell in enumerate(row):
                if not isinstance(cell, dict):
                    continue
                raw = str(cell.get("text", "") or "")
                n = norm(raw)
                if not n:
                    continue

                sr = int(cell.get("start_row_offset_idx", r))
                er = int(cell.get("end_row_offset_idx", r + 1))
                sc = int(cell.get("start_col_offset_idx", c))
                ec = int(cell.get("end_col_offset_idx", c + 1))

                yield {
                    "sheet": sheet_name,
                    "table_idx": t_idx,
                    "text": raw.strip(),
                    "text_norm": n,
                    "x_l": tl + sc,
                    "x_r": tl + ec,
                    "y_t": tt + sr,
                    "y_b": tt + er,
                }

def extract_inline_value(label_norm: str, cell_text: str) -> str:
    # Handle cases like "Werkstoff: S355" or "Werkstoff - S355"
    m = re.match(rf"^{re.escape(label_norm)}\s*[:\-]\s*(.+)$", norm(cell_text))
    return m.group(1).strip() if m else ""

def find_value_right_or_below(label_cell, cells, max_candidates=50):
    # 1) Prefer right side candidates with vertical overlap
    right = []
    for c in cells:
        if c["x_l"] >= label_cell["x_r"]:
            ov = overlaps_1d(label_cell["y_t"], label_cell["y_b"], c["y_t"], c["y_b"])
            if ov > 0:
                dist = c["x_l"] - label_cell["x_r"]
                right.append((dist, -ov, c))  # closer is better; more overlap is better
    right.sort(key=lambda x: (x[0], x[1]))

    for _, _, cand in right[:max_candidates]:
        if cand["text_norm"] and cand["text_norm"] != label_cell["text_norm"]:
            return cand["text"]

    # 2) Fallback: below candidates with horizontal overlap
    below = []
    for c in cells:
        if c["y_t"] >= label_cell["y_b"]:
            ov = overlaps_1d(label_cell["x_l"], label_cell["x_r"], c["x_l"], c["x_r"])
            if ov > 0:
                dist = c["y_t"] - label_cell["y_b"]
                below.append((dist, -ov, c))
    below.sort(key=lambda x: (x[0], x[1]))

    for _, _, cand in below[:max_candidates]:
        if cand["text_norm"] and cand["text_norm"] != label_cell["text_norm"]:
            return cand["text"]

    return ""

def main():
    json_path = pick_docling_json(SCRATCH_DIR)
    doc = json.loads(json_path.read_text(encoding="utf-8"))

    cells = list(iter_cells(doc))
    # group by sheet (usually one)
    by_sheet = {}
    for c in cells:
        by_sheet.setdefault(c["sheet"], []).append(c)

    # Build label lookup
    labels = {norm(k): (k, v) for k, v in GER_TO_KEY.items()}  # norm(label) -> (original_label, output_key)

    result = {}
    debug = {}

    for sheet, sheet_cells in by_sheet.items():
        for cell in sheet_cells:
            # Exact label match or inline "Label: value"
            if cell["text_norm"] in labels:
                orig_label, out_key = labels[cell["text_norm"]]

                # Inline value?
                inline = extract_inline_value(norm(orig_label), cell["text"])
                if inline and out_key not in result:
                    result[out_key] = inline
                    debug[out_key] = f'{sheet} inline in table#{cell["table_idx"]}: "{cell["text"]}"'
                    continue

                if out_key in result:
                    continue

                val = find_value_right_or_below(cell, sheet_cells)
                if val:
                    result[out_key] = val
                    debug[out_key] = f'{sheet} near table#{cell["table_idx"]} label "{cell["text"]}"'

    print("Using JSON:", json_path.name)
    print("\nRESULT:")
    print(json.dumps(result, ensure_ascii=False, indent=2))

    missing = [v for v in GER_TO_KEY.values() if v not in result]
    if missing:
        print("\nMISSING keys:", missing)

    print("\nDEBUG:")
    print(json.dumps(debug, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
