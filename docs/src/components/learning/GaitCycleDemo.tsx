"use client";

import { useMemo, useState } from "react";

export function GaitCycleDemo() {
  const [stepTime, setStepTime] = useState(0.25);
  const [swingRatio, setSwingRatio] = useState(0.4);
  const [stepLength, setStepLength] = useState(0.06);

  const phase = useMemo(() => {
    const stanceRatio = 1 - swingRatio;
    return {
      stance: Math.max(0.1, Math.min(0.9, stanceRatio)),
      swing: Math.max(0.1, Math.min(0.9, swingRatio)),
    };
  }, [swingRatio]);

  const cadence = 1 / stepTime;
  const speed = stepLength * cadence;

  return (
    <div className="border border-fd-border rounded-lg p-4 bg-fd-card">
      <h3 className="text-lg font-semibold mb-4">Gait Cycle Explorer</h3>
      <p className="text-sm text-fd-muted-foreground mb-4">
        Atur durasi langkah, rasio swing, dan panjang langkah untuk melihat
        perubahan kecepatan berjalan dan distribusi fase.
      </p>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="mb-3 flex items-center justify-between text-xs text-fd-muted-foreground">
            <span>Stance Phase</span>
            <span>Swing Phase</span>
          </div>
          <div className="h-8 w-full overflow-hidden rounded-full border border-fd-border bg-fd-muted">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${phase.stance * 100}%` }}
            />
            <div
              className="h-full bg-amber-400"
              style={{ width: `${phase.swing * 100}%`, marginTop: "-2rem" }}
            />
          </div>

          <div className="mt-6 grid gap-3 rounded-lg border border-dashed border-fd-border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-fd-muted-foreground">Cadence</span>
              <span className="font-mono">{cadence.toFixed(2)} step/s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-fd-muted-foreground">Speed</span>
              <span className="font-mono">{(speed * 100).toFixed(1)} cm/s</span>
            </div>
            <div className="text-xs text-fd-muted-foreground">
              Kecepatan dihitung dari step_length / step_time. Swing terlalu
              besar membuat robot cepat tapi tidak stabil.
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium">
            Step Time: {stepTime.toFixed(2)}s
            <input
              type="range"
              min="0.18"
              max="0.5"
              step="0.01"
              value={stepTime}
              onChange={(event) => setStepTime(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </label>

          <label className="block text-sm font-medium">
            Swing Ratio: {(swingRatio * 100).toFixed(0)}%
            <input
              type="range"
              min="0.2"
              max="0.6"
              step="0.02"
              value={swingRatio}
              onChange={(event) => setSwingRatio(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </label>

          <label className="block text-sm font-medium">
            Step Length: {(stepLength * 100).toFixed(1)} cm
            <input
              type="range"
              min="0.02"
              max="0.12"
              step="0.005"
              value={stepLength}
              onChange={(event) => setStepLength(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
