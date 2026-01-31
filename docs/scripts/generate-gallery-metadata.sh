#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

RCLONE_REMOTE="${RCLONE_REMOTE:-}"
RCLONE_BUCKET="${RCLONE_BUCKET:-}"
RCLONE_PREFIX="${RCLONE_PREFIX:-}"
RCLONE_FLAGS="${RCLONE_FLAGS:-}"

OUT_JSON="${OUT_JSON:-$ROOT_DIR/scripts/gallery.metadata.json}"
OUT_TS="${OUT_TS:-$ROOT_DIR/scripts/gallery.metadata.ts}"

FILE_LIMIT="${FILE_LIMIT:-0}"
SKIP_EXISTING="${SKIP_EXISTING:-true}"

CATEGORIES="robots,team,competitions,workshop,behind-the-scenes"
DEBUG="${DEBUG:-false}"

# Gemini CLI defaults (do not read from environment)
GEMINI_BIN="gemini"
GEMINI_MODEL="gemini-3-flash-preview"

if [[ -z "$RCLONE_REMOTE" ]]; then
  if command -v rclone >/dev/null 2>&1; then
    mapfile -t _remotes < <(rclone listremotes 2>/dev/null || true)
  else
    _remotes=()
  fi

  if [[ "${#_remotes[@]}" -eq 1 ]]; then
    RCLONE_REMOTE="${_remotes[0]%/}"
    echo "Using detected rclone remote: ${RCLONE_REMOTE}"
  else
    cat >&2 <<'EOF'
Missing RCLONE_REMOTE.
Examples:
  RCLONE_REMOTE=r2:bascorro-landing-page
  RCLONE_REMOTE=r2: RCLONE_BUCKET=bascorro-landing-page
EOF
    exit 1
  fi
fi

if ! command -v "$GEMINI_BIN" >/dev/null 2>&1; then
  echo "Gemini CLI not found in PATH (GEMINI_BIN=$GEMINI_BIN)." >&2
  exit 1
fi

if ! command -v rclone >/dev/null 2>&1; then
  echo "rclone not found in PATH." >&2
  exit 1
fi

PYTHON_BIN="${PYTHON_BIN:-python3}"
if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  PYTHON_BIN="python"
fi

if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  echo "python3/python not found in PATH." >&2
  exit 1
fi

mkdir -p "$(dirname "$OUT_JSON")"

if [[ ! -f "$OUT_JSON" ]]; then
  echo '{}' > "$OUT_JSON"
fi

PREFIX="${RCLONE_PREFIX#/}"
PREFIX="${PREFIX%/}"

REMOTE="${RCLONE_REMOTE%/}"
if [[ "$REMOTE" == *: ]]; then
  if [[ -z "$RCLONE_BUCKET" ]]; then
    cat >&2 <<'EOF'
RCLONE_REMOTE ends with ":" so a bucket is required.
Example:
  RCLONE_REMOTE=r2: RCLONE_BUCKET=bascorro-landing-page
EOF
    exit 1
  fi
  REMOTE="${REMOTE}${RCLONE_BUCKET}"
fi

if [[ -n "$PREFIX" ]]; then
  RCLONE_PATH="${REMOTE}/${PREFIX}"
else
  RCLONE_PATH="${REMOTE}"
fi

prompt_template() {
  cat <<EOF
You are labeling an image for a robotics team gallery.
Return ONLY valid JSON (no markdown, no extra text) with this schema:
{
  "caption": string,
  "category": one of [${CATEGORIES}] or empty string,
  "date": "YYYY-MM-DD" or empty string,
  "alt": string
}

Rules:
- Use concise, human-friendly captions.
- If you are unsure about date, return empty string.
- If category is unclear, return empty string.
- Do not include any additional keys or commentary.
EOF
}

tmp_root="$ROOT_DIR/.tmp"
mkdir -p "$tmp_root"
tmp_dir="$(mktemp -d -p "$tmp_root" gemini-gallery-XXXXXX)"
trap 'rm -rf "$tmp_dir"' EXIT

parse_script="$tmp_dir/parse_gemini_output.py"
cat <<'PY' > "$parse_script"
import json
import re
import sys

path = sys.argv[1]
key = sys.argv[2]
categories_raw = sys.argv[3]
raw = sys.stdin.read().strip()

def strip_ansi(text: str) -> str:
    return re.sub(r"\x1b\[[0-9;]*[A-Za-z]", "", text)

def strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```\w*\n", "", text)
        text = re.sub(r"\n```$", "", text)
    return text.strip()

def raw_decode_first_json(text: str):
    decoder = json.JSONDecoder()
    match = re.search(r"[\[{]", text)
    if not match:
        raise ValueError("No JSON object found")
    return decoder.raw_decode(text[match.start():])[0]

def parse_jsonish(text: str):
    text = strip_fences(strip_ansi(text))
    if not text:
        raise ValueError("Empty response")
    try:
        return json.loads(text)
    except Exception:
        return raw_decode_first_json(text)

def unwrap_cli_payload(data):
    if isinstance(data, dict) and all(k in data for k in ("caption", "category", "alt")):
        return data
    if isinstance(data, dict):
        for candidate_key in ("output", "text", "message", "response"):
            value = data.get(candidate_key)
            if isinstance(value, str) and value.strip():
                return parse_jsonish(value)
    return data

try:
    parsed = parse_jsonish(raw)
    meta = unwrap_cli_payload(parsed)
    if not isinstance(meta, dict):
        raise ValueError("Expected JSON object")
except Exception as exc:
    raise SystemExit(f"Invalid JSON for {key}: {exc}")

allowed = {item.strip() for item in categories_raw.split(",") if item.strip()}

def to_str(value):
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    return str(value).strip()

clean = {
    "caption": to_str(meta.get("caption", "")),
    "category": to_str(meta.get("category", "")),
    "date": to_str(meta.get("date", "")),
    "alt": to_str(meta.get("alt", "")),
}

if clean["category"] and clean["category"] not in allowed:
    clean["category"] = ""

if not clean["alt"]:
    clean["alt"] = clean["caption"] or "Gallery photo"

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

data[key] = clean

with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, sort_keys=True, ensure_ascii=True)
    f.write("\n")
PY

RCLONE_LIST_FILE="$tmp_dir/rclone-list.txt"
if ! rclone lsf --files-only --format p $RCLONE_FLAGS "$RCLONE_PATH" > "$RCLONE_LIST_FILE"; then
  echo "Failed to list files for ${RCLONE_PATH}" >&2
  exit 1
fi

mapfile -t RCLONE_FILES < "$RCLONE_LIST_FILE"

if [[ "$FILE_LIMIT" -gt 0 && "${#RCLONE_FILES[@]}" -gt "$FILE_LIMIT" ]]; then
  RCLONE_FILES=("${RCLONE_FILES[@]:0:$FILE_LIMIT}")
fi

if [[ "${#RCLONE_FILES[@]}" -eq 0 ]]; then
  echo "No files found under ${RCLONE_PATH}" >&2
  exit 1
fi

total="${#RCLONE_FILES[@]}"
count=0

for rel_path in "${RCLONE_FILES[@]}"; do
  count=$((count + 1))
  if [[ -n "$PREFIX" ]]; then
    key="${PREFIX}/${rel_path}"
  else
    key="${rel_path}"
  fi

  ext="${rel_path##*.}"
  ext_lower="$(printf '%s' "$ext" | tr '[:upper:]' '[:lower:]')"
  case "$ext_lower" in
    jpg|jpeg|png|webp|gif|avif) ;;
    *) continue ;;
  esac

  if [[ "$SKIP_EXISTING" == "true" ]]; then
    if "$PYTHON_BIN" - "$OUT_JSON" "$key" <<'PY' >/dev/null
import json, sys
path = sys.argv[1]
key = sys.argv[2]
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)
sys.exit(0 if key in data else 1)
PY
    then
      echo "[$count/$total] Skip existing: $key"
      continue
    fi
  fi

  tmp_file="$tmp_dir/asset-${count}.${ext_lower}"
  echo "[$count/$total] Fetch: $key"
  if ! rclone copyto $RCLONE_FLAGS "${REMOTE}/${key}" "$tmp_file"; then
    echo "Failed to fetch $key" >&2
    continue
  fi

  prompt="$(prompt_template)"

  echo "[$count/$total] Gemini: $key"
  set +e
  prompt_input="${prompt} @${tmp_file}"
  raw_output=$("$GEMINI_BIN" -m "$GEMINI_MODEL" -p "$prompt_input")
  status=$?
  set -e

  if [[ "$DEBUG" == "true" ]]; then
    echo "----- Gemini raw output for $key -----"
    printf '%s\n' "$raw_output"
    echo "--------------------------------------"
  fi

  if [[ $status -ne 0 || -z "${raw_output// }" ]]; then
    echo "Gemini failed for $key" >&2
    continue
  fi

  if ! printf '%s' "$raw_output" | "$PYTHON_BIN" "$parse_script" "$OUT_JSON" "$key" "$CATEGORIES"; then
    echo "Invalid JSON for $key (saved raw output to $tmp_dir/raw-${count}.txt)" >&2
    printf '%s\n' "$raw_output" > "$tmp_dir/raw-${count}.txt"
    continue
  fi

done

"$PYTHON_BIN" - "$OUT_JSON" "$OUT_TS" <<'PY'
import json, sys

in_path = sys.argv[1]
out_path = sys.argv[2]

with open(in_path, "r", encoding="utf-8") as f:
    data = json.load(f)

lines = [
    "export const GALLERY_METADATA = ",
    json.dumps(data, indent=2, sort_keys=True, ensure_ascii=True),
    " as const;\n",
]

with open(out_path, "w", encoding="utf-8") as f:
    f.write("".join(lines))
PY

"$PYTHON_BIN" - "$OUT_JSON" "$ROOT_DIR/src/lib/gallery.ts" <<'PY'
import json, re, sys

json_path = sys.argv[1]
ts_path = sys.argv[2]

with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

replacement = (
    "export const GALLERY_METADATA: Record<string, GalleryImageMeta> = "
    + json.dumps(data, indent=2, sort_keys=True, ensure_ascii=True)
    + ";\n"
)

with open(ts_path, "r", encoding="utf-8") as f:
    ts = f.read()

pattern = re.compile(
    r"export const GALLERY_METADATA: Record<string, GalleryImageMeta> = \{[\s\S]*?\};\n",
    re.MULTILINE,
)

if not pattern.search(ts):
    raise SystemExit("Could not find GALLERY_METADATA block to replace.")

ts = pattern.sub(replacement, ts)

with open(ts_path, "w", encoding="utf-8") as f:
    f.write(ts)
PY

echo "Wrote JSON: $OUT_JSON"
echo "Wrote TS snippet: $OUT_TS"
echo "Updated: $ROOT_DIR/src/lib/gallery.ts"
