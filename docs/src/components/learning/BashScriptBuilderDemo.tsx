"use client";

import { useMemo, useState } from "react";

function normalizeCommand(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function BashScriptBuilderDemo() {
  const [includeShebang, setIncludeShebang] = useState(true);
  const [includeStrictMode, setIncludeStrictMode] = useState(true);
  const [includeLoop, setIncludeLoop] = useState(true);
  const [includeDirCheck, setIncludeDirCheck] = useState(true);
  const [runCommand, setRunCommand] = useState("");
  const [runResult, setRunResult] = useState<string | null>(null);

  const scriptLines = useMemo(() => {
    const lines: string[] = [];

    if (includeShebang) lines.push("#!/usr/bin/env bash");
    if (includeStrictMode) lines.push("set -eu");
    lines.push("");
    lines.push('echo "== Workspace Check =="');
    if (includeLoop) {
      lines.push("for path in docs ros_ws scripts; do");
      if (includeDirCheck) {
        lines.push('  [ -d "$path" ] && echo "[OK] $path" || echo "[MISS] $path"');
      } else {
        lines.push('  echo "checking $path"');
      }
      lines.push("done");
    }
    lines.push("");
    lines.push('echo "== Git =="');
    lines.push("git rev-parse --abbrev-ref HEAD");
    lines.push("git log --oneline -n ${1:-3}");
    return lines;
  }, [includeDirCheck, includeLoop, includeShebang, includeStrictMode]);

  const missingParts = useMemo(() => {
    const missing: string[] = [];
    if (!includeShebang) missing.push("shebang");
    if (!includeStrictMode) missing.push("set -eu");
    if (!includeLoop) missing.push("loop file check");
    if (!includeDirCheck) missing.push("directory existence check");
    return missing;
  }, [includeDirCheck, includeLoop, includeShebang, includeStrictMode]);

  const isValidStarter = missingParts.length === 0;

  const checkRunCommand = () => {
    const normalized = normalizeCommand(runCommand);
    const accepted = [
      "./scripts/workspace-check.sh",
      "./scripts/workspace-check.sh 5",
      "bash scripts/workspace-check.sh",
      "bash scripts/workspace-check.sh 5",
    ];
    if (accepted.includes(normalized)) {
      setRunResult("Command run valid. Script siap dijalankan.");
      return;
    }
    setRunResult(
      "Command run belum tepat. Coba ./scripts/workspace-check.sh atau tambahkan argumen jumlah commit."
    );
  };

  return (
    <div className="my-6 rounded-xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <h3 className="mb-3 text-base font-semibold text-neutral-800 dark:text-neutral-100">
        Interactive Demo: Script Builder
      </h3>

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeShebang}
            onChange={(event) => setIncludeShebang(event.target.checked)}
          />
          Tambahkan shebang
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeStrictMode}
            onChange={(event) => setIncludeStrictMode(event.target.checked)}
          />
          Aktifkan set -eu
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeLoop}
            onChange={(event) => setIncludeLoop(event.target.checked)}
          />
          Tambahkan loop folder
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeDirCheck}
            onChange={(event) => setIncludeDirCheck(event.target.checked)}
          />
          Cek folder dengan [ -d ]
        </label>
      </div>

      <div className="mb-3 rounded-lg border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-neutral-200">
        {scriptLines.map((line, index) => (
          <div key={`${line}-${index}`}>{line || " "}</div>
        ))}
      </div>

      <div className="mb-4 rounded-lg border border-neutral-200 bg-white p-3 text-sm dark:border-neutral-800 dark:bg-neutral-950">
        {isValidStarter ? (
          <div className="text-green-700 dark:text-green-300">
            Script minimal valid. Kamu siap lanjut ke mini project.
          </div>
        ) : (
          <div className="text-amber-700 dark:text-amber-300">
            Masih kurang: {missingParts.join(", ")}.
          </div>
        )}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mb-2 text-sm font-medium">Run Command Challenge</div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={runCommand}
            onChange={(event) => setRunCommand(event.target.value)}
            placeholder="./scripts/workspace-check.sh 5"
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            type="button"
            onClick={checkRunCommand}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Check
          </button>
        </div>
        {runResult && (
          <div className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">
            {runResult}
          </div>
        )}
      </div>
    </div>
  );
}
