"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

type TerminalLineType = "input" | "output" | "error" | "system";

interface TerminalLine {
  id: string;
  type: TerminalLineType;
  text: string;
}

type FileKind = "file" | "dir";

export interface SimState {
  cwd: string;
  files: Record<string, FileKind>;
  variables: Record<string, string>;
  stepIndex: number;
}

interface SimStatePatch {
  cwd?: string;
  files?: Record<string, FileKind | null>;
  variables?: Record<string, string | null>;
}

export interface ScenarioStep {
  id: string;
  instruction: string;
  acceptedCommands: string[];
  output: string[];
  onSuccessState?: SimStatePatch;
}

interface ShellCommandSimulatorProps {
  title: string;
  prompt?: string;
  initialCwd?: string;
  scenario: ScenarioStep[];
  hints?: string[];
  allowFreeInput?: boolean;
}

const DEFAULT_CWD = "/data/data/com.termux/files/home/projects/bascorro_web";

function normalizeCommand(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function applyStatePatch(state: SimState, patch?: SimStatePatch): SimState {
  if (!patch) return state;

  let nextFiles = state.files;
  if (patch.files) {
    nextFiles = { ...state.files };
    for (const [path, kind] of Object.entries(patch.files)) {
      if (kind === null) {
        delete nextFiles[path];
      } else {
        nextFiles[path] = kind;
      }
    }
  }

  let nextVars = state.variables;
  if (patch.variables) {
    nextVars = { ...state.variables };
    for (const [key, value] of Object.entries(patch.variables)) {
      if (value === null) {
        delete nextVars[key];
      } else {
        nextVars[key] = value;
      }
    }
  }

  return {
    ...state,
    ...(patch.cwd ? { cwd: patch.cwd } : {}),
    files: nextFiles,
    variables: nextVars,
  };
}

export function ShellCommandSimulator({
  title,
  prompt = "$",
  initialCwd = DEFAULT_CWD,
  scenario,
  hints = [],
  allowFreeInput = true,
}: ShellCommandSimulatorProps) {
  const initialState = useMemo<SimState>(
    () => ({
      cwd: initialCwd,
      files: {
        docs: "dir",
        ros_ws: "dir",
        scripts: "dir",
        "README.md": "file",
      },
      variables: {},
      stepIndex: 0,
    }),
    [initialCwd]
  );

  const [simState, setSimState] = useState<SimState>(initialState);
  const [command, setCommand] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Mulai dari Step 1.");
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: "sys-0",
      type: "system",
      text: "Simulator aktif. Jalankan command sesuai instruksi.",
    },
  ]);
  const outputRef = useRef<HTMLDivElement | null>(null);

  const currentStep = scenario[simState.stepIndex];
  const isCompleted = simState.stepIndex >= scenario.length;
  const progressLabel = `${Math.min(simState.stepIndex + 1, scenario.length)}/${scenario.length}`;
  const inputId = useMemo(
    () => `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-command`,
    [title]
  );

  useEffect(() => {
    const node = outputRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [lines]);

  const addLine = (type: TerminalLineType, text: string) => {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setLines((prev) => [...prev, { id, type, text }]);
  };

  const reset = () => {
    setSimState(initialState);
    setCommand("");
    setShowHints(false);
    setStatusMessage("Simulasi di-reset. Mulai lagi dari Step 1.");
    setLines([
      {
        id: "sys-reset",
        type: "system",
        text: "Simulator di-reset.",
      },
    ]);
  };

  const handleRun = (rawCommand: string) => {
    const submitted = rawCommand.trim();
    if (!submitted) return;

    const normalized = normalizeCommand(submitted);
    const terminalPrefix = `${simState.cwd} ${prompt}`;
    addLine("input", `${terminalPrefix} ${submitted}`);

    if (isCompleted) {
      addLine("system", "Semua step sudah selesai. Klik Reset jika ingin mengulang.");
      return;
    }

    const accepted = currentStep.acceptedCommands.map(normalizeCommand);
    if (accepted.includes(normalized)) {
      for (const line of currentStep.output) {
        if (line) addLine("output", line);
      }

      setSimState((prev) => {
        const withStep = { ...prev, stepIndex: prev.stepIndex + 1 };
        return applyStatePatch(withStep, currentStep.onSuccessState);
      });
      setStatusMessage(`Step ${simState.stepIndex + 1} selesai.`);
      return;
    }

    if (!allowFreeInput) {
      addLine("error", "Command tidak sesuai step ini. Ikuti instruksi di panel.");
      setStatusMessage("Command belum sesuai. Coba lagi.");
      return;
    }

    const expected = currentStep.acceptedCommands[0];
    addLine("error", `Belum tepat untuk step ini. Coba format: ${expected}`);
    setStatusMessage("Command belum sesuai. Coba lagi.");
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleRun(command);
    setCommand("");
  };

  return (
    <div className="my-6 rounded-xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-100">
          {title}
        </h3>
        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-200">
          Step {isCompleted ? `${scenario.length}/${scenario.length}` : progressLabel}
        </span>
      </div>

      <div className="mb-3 rounded-lg border border-neutral-200 bg-white p-3 text-sm dark:border-neutral-800 dark:bg-neutral-950">
        {isCompleted ? (
          <div className="text-green-700 dark:text-green-300">
            Semua step selesai. Kamu bisa reset untuk latihan ulang.
          </div>
        ) : (
          <>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
              Instruksi Aktif
            </div>
            <div className="text-neutral-700 dark:text-neutral-200">
              {currentStep?.instruction}
            </div>
          </>
        )}
      </div>

      <div
        ref={outputRef}
        className="mb-3 max-h-72 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs"
      >
        {lines.map((line) => (
          <div
            key={line.id}
            className={
              line.type === "input"
                ? "text-green-300"
                : line.type === "error"
                  ? "text-red-300"
                  : line.type === "system"
                    ? "text-blue-300"
                    : "text-neutral-200"
            }
          >
            {line.text}
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mb-3 flex flex-col gap-2 sm:flex-row">
        <label htmlFor={inputId} className="sr-only">
          Command input
        </label>
        <input
          id={inputId}
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          placeholder="Ketik command di sini..."
          className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Run
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-neutral-700 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-600"
        >
          Reset
        </button>
      </form>

      <div className="mb-2 text-xs text-neutral-600 dark:text-neutral-400" aria-live="polite">
        {statusMessage}
      </div>

      {hints.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowHints((prev) => !prev)}
            className="text-xs font-medium text-blue-600 hover:text-blue-500"
          >
            {showHints ? "Sembunyikan hint" : "Tampilkan hint"}
          </button>
          {showHints && (
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-neutral-600 dark:text-neutral-300">
              {hints.map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
