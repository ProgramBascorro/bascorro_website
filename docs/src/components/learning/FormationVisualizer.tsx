"use client";

import { useState } from "react";

interface Robot {
  id: number;
  x: number;
  y: number;
  role: string;
  color: string;
}

interface Formation {
  name: string;
  robots: Robot[];
}

export function FormationVisualizer() {
  const [selectedFormation, setSelectedFormation] = useState("1-2-1");
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
  const [isDraggingBall, setIsDraggingBall] = useState(false);

  const formations: Record<string, Formation> = {
    "1-2-1": {
      name: "1-2-1 (Balanced)",
      robots: [
        { id: 1, x: 10, y: 50, role: "GK", color: "#ef4444" },
        { id: 2, x: 30, y: 30, role: "DEF", color: "#3b82f6" },
        { id: 3, x: 30, y: 70, role: "DEF", color: "#3b82f6" },
        { id: 4, x: 60, y: 50, role: "STR", color: "#10b981" },
      ],
    },
    "2-1-1": {
      name: "2-1-1 (Defensive)",
      robots: [
        { id: 1, x: 10, y: 50, role: "GK", color: "#ef4444" },
        { id: 2, x: 25, y: 30, role: "DEF", color: "#3b82f6" },
        { id: 3, x: 25, y: 70, role: "DEF", color: "#3b82f6" },
        { id: 4, x: 45, y: 50, role: "SUP", color: "#f59e0b" },
      ],
    },
    "1-1-2": {
      name: "1-1-2 (Offensive)",
      robots: [
        { id: 1, x: 10, y: 50, role: "GK", color: "#ef4444" },
        { id: 2, x: 25, y: 50, role: "DEF", color: "#3b82f6" },
        { id: 3, x: 55, y: 30, role: "STR", color: "#10b981" },
        { id: 4, x: 55, y: 70, role: "STR", color: "#10b981" },
      ],
    },
    kickoff: {
      name: "Kick-off",
      robots: [
        { id: 1, x: 10, y: 50, role: "GK", color: "#ef4444" },
        { id: 2, x: 35, y: 30, role: "DEF", color: "#3b82f6" },
        { id: 3, x: 35, y: 70, role: "DEF", color: "#3b82f6" },
        { id: 4, x: 48, y: 50, role: "STR", color: "#10b981" },
      ],
    },
  };

  const currentFormation = formations[selectedFormation];

  // Field dimensions (percentage based)
  const fieldWidth = 100;
  const fieldHeight = 100;

  const handleBallDrag = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDraggingBall) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setBallPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  return (
    <div className="border border-fd-border rounded-lg p-4 bg-fd-card">
      <h3 className="text-lg font-semibold mb-4">Team Formation Visualizer</h3>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Field */}
        <div className="flex-1">
          <svg
            viewBox="0 0 100 100"
            className="w-full max-w-[500px] aspect-[3/2] bg-emerald-600 rounded-lg border-4 border-white"
            onMouseMove={handleBallDrag}
            onMouseUp={() => setIsDraggingBall(false)}
            onMouseLeave={() => setIsDraggingBall(false)}
          >
            {/* Field markings */}
            {/* Center line */}
            <line
              x1="50"
              y1="0"
              x2="50"
              y2="100"
              stroke="white"
              strokeWidth="0.5"
            />
            {/* Center circle */}
            <circle
              cx="50"
              cy="50"
              r="15"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
            <circle cx="50" cy="50" r="1" fill="white" />

            {/* Left penalty area */}
            <rect
              x="0"
              y="25"
              width="15"
              height="50"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
            {/* Left goal area */}
            <rect
              x="0"
              y="35"
              width="6"
              height="30"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
            {/* Left goal */}
            <rect x="-2" y="40" width="2" height="20" fill="#fbbf24" />

            {/* Right penalty area */}
            <rect
              x="85"
              y="25"
              width="15"
              height="50"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
            {/* Right goal area */}
            <rect
              x="94"
              y="35"
              width="6"
              height="30"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
            {/* Right goal */}
            <rect x="100" y="40" width="2" height="20" fill="#fbbf24" />

            {/* Corner arcs */}
            <path
              d="M 0 5 A 5 5 0 0 0 5 0"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
            <path
              d="M 95 0 A 5 5 0 0 0 100 5"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
            <path
              d="M 0 95 A 5 5 0 0 1 5 100"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
            <path
              d="M 95 100 A 5 5 0 0 1 100 95"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />

            {/* Robots */}
            {currentFormation.robots.map((robot) => (
              <g key={robot.id}>
                {/* Robot body */}
                <circle
                  cx={robot.x}
                  cy={robot.y}
                  r="4"
                  fill={robot.color}
                  stroke="white"
                  strokeWidth="0.5"
                />
                {/* Direction indicator */}
                <line
                  x1={robot.x}
                  y1={robot.y}
                  x2={robot.x + 3}
                  y2={robot.y}
                  stroke="white"
                  strokeWidth="1"
                />
                {/* Role label */}
                <text
                  x={robot.x}
                  y={robot.y - 6}
                  fontSize="3"
                  fill="white"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {robot.role}
                </text>
              </g>
            ))}

            {/* Ball */}
            <circle
              cx={ballPosition.x}
              cy={ballPosition.y}
              r="2.5"
              fill="white"
              stroke="black"
              strokeWidth="0.3"
              style={{ cursor: "grab" }}
              onMouseDown={() => setIsDraggingBall(true)}
            />
            {/* Ball pattern */}
            <circle
              cx={ballPosition.x - 0.8}
              cy={ballPosition.y - 0.8}
              r="0.6"
              fill="black"
              pointerEvents="none"
            />
            <circle
              cx={ballPosition.x + 0.8}
              cy={ballPosition.y + 0.8}
              r="0.6"
              fill="black"
              pointerEvents="none"
            />
          </svg>
          <p className="text-xs text-fd-muted-foreground mt-2 text-center">
            Drag the ball to see how formations might adapt
          </p>
        </div>

        {/* Controls */}
        <div className="w-full lg:w-64 space-y-4">
          {/* Formation selector */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Select Formation:</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(formations).map(([key, formation]) => (
                <button
                  key={key}
                  onClick={() => setSelectedFormation(key)}
                  className={`px-3 py-2 text-xs rounded transition-colors ${
                    selectedFormation === key
                      ? "bg-fd-primary text-fd-primary-foreground"
                      : "bg-fd-muted hover:bg-fd-accent"
                  }`}
                >
                  {formation.name}
                </button>
              ))}
            </div>
          </div>

          {/* Current formation info */}
          <div className="bg-fd-muted/50 rounded-lg p-3">
            <h4 className="text-sm font-semibold mb-2">Formation Details:</h4>
            <p className="text-xs text-fd-muted-foreground mb-2">
              {selectedFormation === "1-2-1" &&
                "Balanced formation for general play. Good coverage with midfielder support."}
              {selectedFormation === "2-1-1" &&
                "Defensive formation when protecting a lead. Two dedicated defenders with support."}
              {selectedFormation === "1-1-2" &&
                "Aggressive formation for attacking. Two strikers for maximum pressure."}
              {selectedFormation === "kickoff" &&
                "Starting position for kick-off. Striker ready at center circle."}
            </p>
          </div>

          {/* Role legend */}
          <div className="bg-fd-muted/50 rounded-lg p-3">
            <h4 className="text-sm font-semibold mb-2">Roles:</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>GK - Goalkeeper</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>DEF - Defender</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span>SUP - Supporter</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span>STR - Striker</span>
              </div>
            </div>
          </div>

          {/* Ball position */}
          <div className="bg-fd-muted/50 rounded-lg p-3">
            <h4 className="text-sm font-semibold mb-1">Ball Position:</h4>
            <p className="text-xs font-mono">
              X: {ballPosition.x.toFixed(1)}% | Y: {ballPosition.y.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
