"use client";

import { useMemo, useState } from "react";

export function ZmpBalanceDemo() {
  const [comX, setComX] = useState(0);
  const [comY, setComY] = useState(0);
  const [zmpX, setZmpX] = useState(0);
  const [zmpY, setZmpY] = useState(0);

  const status = useMemo(() => {
    const inside = Math.abs(zmpX) <= 1 && Math.abs(zmpY) <= 0.6;
    return inside ? "Stable" : "Unstable";
  }, [zmpX, zmpY]);

  return (
    <div className="border border-fd-border rounded-lg p-4 bg-fd-card">
      <h3 className="text-lg font-semibold mb-4">ZMP & Support Polygon</h3>
      <p className="text-sm text-fd-muted-foreground mb-4">
        Atur posisi CoM dan ZMP untuk melihat apakah masih berada di dalam
        support polygon. Jika ZMP keluar, robot cenderung jatuh.
      </p>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex items-center justify-center">
          <svg viewBox="-2.5 -1.5 5 3" className="w-full max-w-[360px]">
            <rect
              x="-1"
              y="-0.6"
              width="2"
              height="1.2"
              fill="rgba(16,185,129,0.12)"
              stroke="#10b981"
              strokeWidth="0.05"
              rx="0.05"
            />
            <circle cx={comX} cy={comY} r="0.12" fill="#3b82f6" />
            <circle cx={zmpX} cy={zmpY} r="0.12" fill="#f97316" />
            <text x="-2.2" y="-1.1" fontSize="0.2" fill="currentColor">
              CoM
            </text>
            <circle cx="-1.7" cy="-1.08" r="0.08" fill="#3b82f6" />
            <text x="-2.2" y="-0.8" fontSize="0.2" fill="currentColor">
              ZMP
            </text>
            <circle cx="-1.7" cy="-0.78" r="0.08" fill="#f97316" />
          </svg>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-fd-border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span
                className={`font-semibold ${
                  status === "Stable" ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                {status}
              </span>
            </div>
            <p className="text-xs text-fd-muted-foreground mt-2">
              Support polygon adalah area kontak kaki. ZMP harus berada di
              dalamnya agar gaya tanah dapat menahan tubuh.
            </p>
          </div>

          <label className="block text-sm font-medium">
            CoM X (forward/back): {comX.toFixed(2)}
            <input
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={comX}
              onChange={(event) => setComX(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </label>

          <label className="block text-sm font-medium">
            CoM Y (left/right): {comY.toFixed(2)}
            <input
              type="range"
              min="-0.8"
              max="0.8"
              step="0.05"
              value={comY}
              onChange={(event) => setComY(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </label>

          <label className="block text-sm font-medium">
            ZMP X: {zmpX.toFixed(2)}
            <input
              type="range"
              min="-1.2"
              max="1.2"
              step="0.05"
              value={zmpX}
              onChange={(event) => setZmpX(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </label>

          <label className="block text-sm font-medium">
            ZMP Y: {zmpY.toFixed(2)}
            <input
              type="range"
              min="-0.9"
              max="0.9"
              step="0.05"
              value={zmpY}
              onChange={(event) => setZmpY(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
