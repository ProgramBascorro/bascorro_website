#!/usr/bin/env python3
import csv
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "docs" / "database_ews_bascorro-2026.csv"
OUT_DIR = ROOT / "docs" / "public" / "team" / "2026"

EXT_BY_MIME = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}


def extract_drive_id(url: str) -> str | None:
    if not url:
        return None
    match = re.search(r"[?&]id=([^&]+)", url)
    if match:
        return match.group(1)
    match = re.search(r"/d/([^/]+)", url)
    if match:
        return match.group(1)
    match = re.search(r"/file/d/([^/]+)", url)
    if match:
        return match.group(1)
    return None


def detect_extension(path: Path) -> str:
    try:
        mime = (
            subprocess.check_output(["file", "-b", "--mime-type", str(path)])
            .decode()
            .strip()
        )
    except Exception:
        return "jpg"
    return EXT_BY_MIME.get(mime, "jpg")


def download_image(url: str, target_base: Path) -> Path:
    tmp_path = target_base.with_suffix(".tmp")
    if tmp_path.exists():
        tmp_path.unlink()
    subprocess.run(
        ["gdown", "--fuzzy", "--output", str(tmp_path), url],
        check=True,
    )
    ext = detect_extension(tmp_path)
    final_path = target_base.with_suffix(f".{ext}")
    if final_path.exists():
        tmp_path.unlink()
        return final_path
    tmp_path.rename(final_path)
    return final_path


def main() -> int:
    if not CSV_PATH.exists():
        print(f"CSV not found: {CSV_PATH}")
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    with CSV_PATH.open(newline="", encoding="utf-8") as file:
        reader = csv.reader(file)
        headers = next(reader, [])
        header_map = {header.strip(): index for index, header in enumerate(headers)}

        def get(row: list[str], key: str) -> str:
            idx = header_map.get(key)
            if idx is None or idx >= len(row):
                return ""
            return row[idx].strip()

        total = 0
        skipped = 0
        failures: list[str] = []

        for row in reader:
            url = get(row, "Foto Diri (Bebas, Semi Formal)")
            if not url:
                skipped += 1
                continue
            file_id = extract_drive_id(url)
            if not file_id:
                skipped += 1
                continue

            if any((OUT_DIR / f"{file_id}.{ext}").exists() for ext in EXT_BY_MIME.values()):
                continue

            total += 1
            try:
                download_image(url, OUT_DIR / file_id)
            except Exception as exc:
                failures.append(f"{file_id}: {exc}")

    if failures:
        print("Some downloads failed:")
        for item in failures:
            print(f"- {item}")

    print(f"Downloaded: {total}. Skipped: {skipped}. Failed: {len(failures)}")
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
