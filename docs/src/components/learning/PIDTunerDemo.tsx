"use client";

import { useState, useEffect, useCallback } from "react";

interface DataPoint {
  time: number;
  setpoint: number;
  actual: number;
}

export function PIDTunerDemo() {
  const [kp, setKp] = useState(1.0);
  const [ki, setKi] = useState(0.1);
  const [kd, setKd] = useState(0.05);
  const [data, setData] = useState<DataPoint[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState({
    riseTime: 0,
    overshoot: 0,
    settlingTime: 0,
    steadyStateError: 0,
  });

  const setpoint = 100;
  const dt = 0.02; // 20ms time step
  const totalTime = 5; // 5 seconds simulation

  const simulatePID = useCallback(() => {
    const newData: DataPoint[] = [];
    let actual = 0;
    let integral = 0;
    let prevError = 0;
    let maxValue = 0;
    let riseTime = 0;
    let settlingTime = 0;
    let hasRisen = false;

    for (let t = 0; t <= totalTime; t += dt) {
      const error = setpoint - actual;
      integral += error * dt;
      const derivative = (error - prevError) / dt;

      // PID output
      const output = kp * error + ki * integral + kd * derivative;

      // Simple first-order system response
      const systemGain = 0.1;
      actual += output * systemGain * dt;

      // Clamp to prevent extreme values
      actual = Math.max(-50, Math.min(200, actual));

      newData.push({
        time: t,
        setpoint,
        actual,
      });

      // Track max value for overshoot calculation
      if (actual > maxValue) maxValue = actual;

      // Rise time (10% to 90%)
      if (!hasRisen && actual >= setpoint * 0.9) {
        riseTime = t;
        hasRisen = true;
      }

      // Settling time (within 2% of setpoint)
      if (Math.abs(actual - setpoint) > setpoint * 0.02) {
        settlingTime = t;
      }

      prevError = error;
    }

    const overshoot = ((maxValue - setpoint) / setpoint) * 100;
    const steadyStateError = Math.abs(
      setpoint - newData[newData.length - 1].actual
    );

    setData(newData);
    setMetrics({
      riseTime: Math.max(0, riseTime),
      overshoot: Math.max(0, overshoot),
      settlingTime: settlingTime + dt,
      steadyStateError,
    });
  }, [kp, ki, kd]);

  useEffect(() => {
    simulatePID();
  }, [simulatePID]);

  // SVG dimensions
  const width = 500;
  const height = 250;
  const padding = 40;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  // Scale functions
  const xScale = (t: number) => padding + (t / totalTime) * plotWidth;
  const yScale = (v: number) => height - padding - (v / 150) * plotHeight;

  // Generate path for data
  const generatePath = (key: "setpoint" | "actual") => {
    if (data.length === 0) return "";
    return data
      .map(
        (d, i) => `${i === 0 ? "M" : "L"} ${xScale(d.time)} ${yScale(d[key])}`
      )
      .join(" ");
  };

  const presets = [
    { name: "Underdamped", kp: 2.0, ki: 0.5, kd: 0.1 },
    { name: "Overdamped", kp: 0.5, ki: 0.05, kd: 0.5 },
    { name: "Critically Damped", kp: 1.2, ki: 0.2, kd: 0.3 },
    { name: "Aggressive", kp: 3.0, ki: 1.0, kd: 0.05 },
    { name: "Conservative", kp: 0.3, ki: 0.02, kd: 0.1 },
  ];

  return (
    <div className="border border-fd-border rounded-lg p-4 bg-fd-card">
      <h3 className="text-lg font-semibold mb-4">PID Controller Tuning</h3>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Graph */}
        <div className="flex-1">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full bg-fd-background rounded-lg border border-fd-border"
          >
            {/* Grid lines */}
            {[0, 50, 100, 150].map((v) => (
              <g key={v}>
                <line
                  x1={padding}
                  y1={yScale(v)}
                  x2={width - padding}
                  y2={yScale(v)}
                  stroke="currentColor"
                  strokeWidth="0.5"
                  opacity="0.2"
                />
                <text
                  x={padding - 5}
                  y={yScale(v)}
                  fontSize="10"
                  textAnchor="end"
                  fill="currentColor"
                  opacity="0.5"
                  dominantBaseline="middle"
                >
                  {v}
                </text>
              </g>
            ))}

            {/* Time axis labels */}
            {[0, 1, 2, 3, 4, 5].map((t) => (
              <text
                key={t}
                x={xScale(t)}
                y={height - padding + 15}
                fontSize="10"
                textAnchor="middle"
                fill="currentColor"
                opacity="0.5"
              >
                {t}s
              </text>
            ))}

            {/* Axis labels */}
            <text
              x={width / 2}
              y={height - 5}
              fontSize="12"
              textAnchor="middle"
              fill="currentColor"
              opacity="0.7"
            >
              Time (s)
            </text>
            <text
              x={15}
              y={height / 2}
              fontSize="12"
              textAnchor="middle"
              fill="currentColor"
              opacity="0.7"
              transform={`rotate(-90, 15, ${height / 2})`}
            >
              Value
            </text>

            {/* Setpoint line */}
            <path
              d={generatePath("setpoint")}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="5,5"
            />

            {/* Actual response line */}
            <path
              d={generatePath("actual")}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
            />

            {/* Settling band (2%) */}
            <rect
              x={padding}
              y={yScale(setpoint * 1.02)}
              width={plotWidth}
              height={yScale(setpoint * 0.98) - yScale(setpoint * 1.02)}
              fill="#10b981"
              opacity="0.1"
            />

            {/* Legend */}
            <g transform={`translate(${padding + 10}, ${padding + 10})`}>
              <line
                x1="0"
                y1="0"
                x2="20"
                y2="0"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              <text x="25" y="4" fontSize="10" fill="currentColor">
                Setpoint
              </text>
              <line
                x1="0"
                y1="15"
                x2="20"
                y2="15"
                stroke="#10b981"
                strokeWidth="2"
              />
              <text x="25" y="19" fontSize="10" fill="currentColor">
                Response
              </text>
            </g>
          </svg>
        </div>

        {/* Controls */}
        <div className="w-full xl:w-72 space-y-4">
          {/* PID Gains */}
          <div className="space-y-3">
            <div>
              <label className="flex justify-between text-sm font-medium mb-1">
                <span>Kp (Proportional)</span>
                <span className="font-mono text-emerald-500">
                  {kp.toFixed(2)}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={kp}
                onChange={(e) => setKp(Number(e.target.value))}
                className="w-full h-2 bg-fd-muted rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div>
              <label className="flex justify-between text-sm font-medium mb-1">
                <span>Ki (Integral)</span>
                <span className="font-mono text-blue-500">{ki.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={ki}
                onChange={(e) => setKi(Number(e.target.value))}
                className="w-full h-2 bg-fd-muted rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div>
              <label className="flex justify-between text-sm font-medium mb-1">
                <span>Kd (Derivative)</span>
                <span className="font-mono text-purple-500">
                  {kd.toFixed(2)}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={kd}
                onChange={(e) => setKd(Number(e.target.value))}
                className="w-full h-2 bg-fd-muted rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>

          {/* Presets */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Presets:</h4>
            <div className="flex flex-wrap gap-1">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setKp(preset.kp);
                    setKi(preset.ki);
                    setKd(preset.kd);
                  }}
                  className="px-2 py-1 text-xs bg-fd-muted hover:bg-fd-accent rounded transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Metrics */}
          <div className="bg-fd-muted/50 rounded-lg p-3">
            <h4 className="text-sm font-semibold mb-2">Performance Metrics:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-fd-muted-foreground">Rise Time:</span>
                <span className="font-mono">
                  {metrics.riseTime.toFixed(2)}s
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-fd-muted-foreground">Overshoot:</span>
                <span
                  className={`font-mono ${
                    metrics.overshoot > 20 ? "text-red-500" : ""
                  }`}
                >
                  {metrics.overshoot.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-fd-muted-foreground">Settling Time:</span>
                <span className="font-mono">
                  {metrics.settlingTime.toFixed(2)}s
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-fd-muted-foreground">SS Error:</span>
                <span className="font-mono">
                  {metrics.steadyStateError.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* PID Formula */}
          <div className="bg-fd-muted/50 rounded-lg p-3">
            <h4 className="text-sm font-semibold mb-1">PID Formula:</h4>
            <code className="text-xs">
              u(t) = Kp*e + Ki*integral(e) + Kd*de/dt
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
