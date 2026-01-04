"use client";

import { useState, useCallback } from "react";

interface Point {
  x: number;
  y: number;
}

export function KinematicsVisualizer() {
  const [theta1, setTheta1] = useState(45);
  const [theta2, setTheta2] = useState(30);
  const L1 = 100; // Link 1 length in pixels
  const L2 = 80; // Link 2 length in pixels

  // Forward Kinematics calculation
  const calculateFK = useCallback((): { joint1: Point; endEffector: Point } => {
    const t1Rad = (theta1 * Math.PI) / 180;
    const t2Rad = (theta2 * Math.PI) / 180;

    const joint1: Point = {
      x: L1 * Math.cos(t1Rad),
      y: L1 * Math.sin(t1Rad),
    };

    const endEffector: Point = {
      x: joint1.x + L2 * Math.cos(t1Rad + t2Rad),
      y: joint1.y + L2 * Math.sin(t1Rad + t2Rad),
    };

    return { joint1, endEffector };
  }, [theta1, theta2]);

  const { joint1, endEffector } = calculateFK();

  // Canvas center offset
  const centerX = 200;
  const centerY = 200;

  // Convert to canvas coordinates (flip Y axis)
  const toCanvas = (p: Point) => ({
    x: centerX + p.x,
    y: centerY - p.y,
  });

  const base = { x: centerX, y: centerY };
  const j1Canvas = toCanvas(joint1);
  const eeCanvas = toCanvas(endEffector);

  // Calculate workspace boundary points
  const workspacePoints = [];
  for (let angle = 0; angle < 360; angle += 5) {
    const rad = (angle * Math.PI) / 180;
    // Outer boundary (L1 + L2)
    workspacePoints.push({
      x: centerX + (L1 + L2) * Math.cos(rad),
      y: centerY - (L1 + L2) * Math.sin(rad),
    });
  }

  return (
    <div className="border border-fd-border rounded-lg p-4 bg-fd-card">
      <h3 className="text-lg font-semibold mb-4">2-Link Arm Kinematics</h3>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* SVG Visualization */}
        <div className="flex-1">
          <svg
            viewBox="0 0 400 400"
            className="w-full max-w-[400px] bg-fd-background rounded-lg border border-fd-border"
          >
            {/* Grid */}
            <defs>
              <pattern
                id="grid"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  opacity="0.1"
                />
              </pattern>
            </defs>
            <rect width="400" height="400" fill="url(#grid)" />

            {/* Axes */}
            <line
              x1="0"
              y1={centerY}
              x2="400"
              y2={centerY}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.3"
            />
            <line
              x1={centerX}
              y1="0"
              x2={centerX}
              y2="400"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.3"
            />
            <text
              x="390"
              y={centerY - 5}
              fontSize="12"
              fill="currentColor"
              opacity="0.5"
            >
              X
            </text>
            <text
              x={centerX + 5}
              y="15"
              fontSize="12"
              fill="currentColor"
              opacity="0.5"
            >
              Y
            </text>

            {/* Workspace boundary (outer) */}
            <circle
              cx={centerX}
              cy={centerY}
              r={L1 + L2}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1"
              strokeDasharray="5,5"
              opacity="0.3"
            />

            {/* Workspace boundary (inner) */}
            <circle
              cx={centerX}
              cy={centerY}
              r={Math.abs(L1 - L2)}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1"
              strokeDasharray="5,5"
              opacity="0.3"
            />

            {/* Link 1 */}
            <line
              x1={base.x}
              y1={base.y}
              x2={j1Canvas.x}
              y2={j1Canvas.y}
              stroke="#10b981"
              strokeWidth="8"
              strokeLinecap="round"
            />

            {/* Link 2 */}
            <line
              x1={j1Canvas.x}
              y1={j1Canvas.y}
              x2={eeCanvas.x}
              y2={eeCanvas.y}
              stroke="#f59e0b"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* Base joint */}
            <circle cx={base.x} cy={base.y} r="10" fill="#6b7280" />
            <circle cx={base.x} cy={base.y} r="6" fill="#374151" />

            {/* Joint 1 */}
            <circle cx={j1Canvas.x} cy={j1Canvas.y} r="8" fill="#10b981" />
            <circle cx={j1Canvas.x} cy={j1Canvas.y} r="4" fill="#059669" />

            {/* End Effector */}
            <circle cx={eeCanvas.x} cy={eeCanvas.y} r="8" fill="#ef4444" />
            <circle cx={eeCanvas.x} cy={eeCanvas.y} r="4" fill="#dc2626" />

            {/* Angle arcs */}
            <path
              d={`M ${base.x + 30} ${base.y} A 30 30 0 ${
                theta1 > 180 ? 1 : 0
              } 0 ${base.x + 30 * Math.cos((theta1 * Math.PI) / 180)} ${
                base.y - 30 * Math.sin((theta1 * Math.PI) / 180)
              }`}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
            />

            {/* Labels */}
            <text x={base.x + 35} y={base.y - 5} fontSize="12" fill="#10b981">
              θ1
            </text>
          </svg>
        </div>

        {/* Controls and Info */}
        <div className="flex-1 space-y-4">
          {/* Sliders */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                θ1 (Joint 1): {theta1}°
              </label>
              <input
                type="range"
                min="-180"
                max="180"
                value={theta1}
                onChange={(e) => setTheta1(Number(e.target.value))}
                className="w-full h-2 bg-fd-muted rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                θ2 (Joint 2): {theta2}°
              </label>
              <input
                type="range"
                min="-180"
                max="180"
                value={theta2}
                onChange={(e) => setTheta2(Number(e.target.value))}
                className="w-full h-2 bg-fd-muted rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          {/* Calculated Values */}
          <div className="bg-fd-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm">
              Forward Kinematics Result:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-fd-muted-foreground">
                  End-Effector X:
                </span>
                <span className="ml-2 font-mono">
                  {endEffector.x.toFixed(2)} px
                </span>
              </div>
              <div>
                <span className="text-fd-muted-foreground">
                  End-Effector Y:
                </span>
                <span className="ml-2 font-mono">
                  {endEffector.y.toFixed(2)} px
                </span>
              </div>
              <div>
                <span className="text-fd-muted-foreground">Distance:</span>
                <span className="ml-2 font-mono">
                  {Math.sqrt(endEffector.x ** 2 + endEffector.y ** 2).toFixed(
                    2
                  )}{" "}
                  px
                </span>
              </div>
              <div>
                <span className="text-fd-muted-foreground">Angle:</span>
                <span className="ml-2 font-mono">
                  {(
                    (Math.atan2(endEffector.y, endEffector.x) * 180) /
                    Math.PI
                  ).toFixed(1)}
                  °
                </span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-fd-muted/50 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2">Legend:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-emerald-500 rounded"></div>
                <span>Link 1 (L1 = {L1}px)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-amber-500 rounded"></div>
                <span>Link 2 (L2 = {L2}px)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>End Effector</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 border-t-2 border-dashed border-blue-500"></div>
                <span>Workspace Boundary</span>
              </div>
            </div>
          </div>

          {/* FK Formula */}
          <div className="bg-fd-muted/50 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2">FK Equations:</h4>
            <code className="text-xs block">
              x = L1*cos(θ1) + L2*cos(θ1+θ2)
              <br />y = L1*sin(θ1) + L2*sin(θ1+θ2)
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
