"use client";

import { useState, useCallback, useMemo } from "react";

interface Ball {
  x: number;
  y: number;
  radius: number;
  detected: boolean;
}

interface DetectionParams {
  minRadius: number;
  maxRadius: number;
  circularityThreshold: number;
  noiseLevel: number;
}

// Generate a simulated field with balls and noise
const generateField = (
  params: DetectionParams
): { balls: Ball[]; noise: Array<{ x: number; y: number; size: number }> } => {
  const balls: Ball[] = [
    { x: 150, y: 120, radius: 25, detected: false },
    { x: 350, y: 200, radius: 20, detected: false },
    { x: 250, y: 280, radius: 15, detected: false },
  ];

  // Generate noise based on noise level
  const noiseCount = Math.floor(params.noiseLevel * 20);
  const noise = Array.from({ length: noiseCount }, () => ({
    x: Math.random() * 500,
    y: Math.random() * 350,
    size: Math.random() * 30 + 5,
  }));

  return { balls, noise };
};

export function BallDetectionVisualizer() {
  const [params, setParams] = useState<DetectionParams>({
    minRadius: 10,
    maxRadius: 35,
    circularityThreshold: 0.7,
    noiseLevel: 0.3,
  });

  const [method, setMethod] = useState<"hsv" | "hough" | "blob">("hsv");

  const updateParam = useCallback(
    (key: keyof DetectionParams, value: number) => {
      setParams((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const { balls, noise } = useMemo(
    () => generateField(params),
    [params.noiseLevel]
  );

  // Simulate detection based on parameters
  const detectionResults = useMemo(() => {
    return balls.map((ball) => {
      const inRange =
        ball.radius >= params.minRadius && ball.radius <= params.maxRadius;
      const randomFactor = Math.random();

      // Different methods have different detection characteristics
      let detected = false;
      let confidence = 0;

      switch (method) {
        case "hsv":
          detected = inRange && randomFactor < 0.9;
          confidence = detected ? 0.85 + Math.random() * 0.15 : 0;
          break;
        case "hough":
          detected = inRange && randomFactor < 0.75;
          confidence = detected ? 0.7 + Math.random() * 0.2 : 0;
          break;
        case "blob":
          detected = inRange && randomFactor < 0.8;
          confidence = detected ? 0.75 + Math.random() * 0.2 : 0;
          break;
      }

      return { ...ball, detected, confidence };
    });
  }, [balls, params, method]);

  // False positives from noise
  const falsePositives = useMemo(() => {
    const fpRate = method === "hough" ? 0.15 : method === "blob" ? 0.1 : 0.05;
    return noise
      .filter(() => Math.random() < fpRate)
      .map((n) => ({
        x: n.x,
        y: n.y,
        radius: n.size / 2,
      }));
  }, [noise, method]);

  const truePositives = detectionResults.filter((r) => r.detected).length;
  const totalBalls = balls.length;
  const fps = method === "hsv" ? 60 : method === "blob" ? 45 : 30;

  return (
    <div className="my-6 p-4 border rounded-lg bg-fd-card">
      <h3 className="text-lg font-semibold mb-4">
        ⚽ Ball Detection Simulator
      </h3>

      {/* Method Selection */}
      <div className="mb-4">
        <span className="text-sm font-medium mr-2">Detection Method:</span>
        <div className="flex gap-2 mt-1">
          {(["hsv", "hough", "blob"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`px-3 py-1 text-sm rounded ${
                method === m
                  ? "bg-fd-primary text-fd-primary-foreground"
                  : "bg-fd-secondary hover:bg-fd-accent"
              }`}
            >
              {m === "hsv"
                ? "HSV Segmentation"
                : m === "hough"
                ? "Hough Circle"
                : "Blob Detection"}
            </button>
          ))}
        </div>
      </div>

      {/* Parameters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="text-xs text-fd-muted-foreground">Min Radius</label>
          <input
            type="range"
            min="5"
            max="30"
            value={params.minRadius}
            onChange={(e) => updateParam("minRadius", parseInt(e.target.value))}
            className="w-full"
          />
          <span className="text-xs">{params.minRadius}px</span>
        </div>
        <div>
          <label className="text-xs text-fd-muted-foreground">Max Radius</label>
          <input
            type="range"
            min="20"
            max="50"
            value={params.maxRadius}
            onChange={(e) => updateParam("maxRadius", parseInt(e.target.value))}
            className="w-full"
          />
          <span className="text-xs">{params.maxRadius}px</span>
        </div>
        <div>
          <label className="text-xs text-fd-muted-foreground">
            Circularity
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={params.circularityThreshold * 100}
            onChange={(e) =>
              updateParam(
                "circularityThreshold",
                parseInt(e.target.value) / 100
              )
            }
            className="w-full"
          />
          <span className="text-xs">
            {(params.circularityThreshold * 100).toFixed(0)}%
          </span>
        </div>
        <div>
          <label className="text-xs text-fd-muted-foreground">
            Noise Level
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={params.noiseLevel * 100}
            onChange={(e) =>
              updateParam("noiseLevel", parseInt(e.target.value) / 100)
            }
            className="w-full"
          />
          <span className="text-xs">
            {(params.noiseLevel * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Visualization */}
      <div
        className="relative bg-green-800 rounded-lg overflow-hidden mb-4"
        style={{ height: 350 }}
      >
        {/* Field markings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 border-2 border-white/30 rounded-full" />
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-white/30" />

        {/* Noise */}
        {noise.map((n, i) => (
          <div
            key={`noise-${i}`}
            className="absolute bg-orange-300/30 rounded-full"
            style={{
              left: n.x,
              top: n.y,
              width: n.size,
              height: n.size,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}

        {/* Balls */}
        {detectionResults.map((ball, i) => (
          <div
            key={`ball-${i}`}
            className="absolute"
            style={{ left: ball.x, top: ball.y }}
          >
            {/* Actual ball */}
            <div
              className="absolute bg-orange-500 rounded-full shadow-lg"
              style={{
                width: ball.radius * 2,
                height: ball.radius * 2,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-orange-300 to-orange-600" />
            </div>

            {/* Detection indicator */}
            {ball.detected && (
              <div
                className="absolute border-2 border-green-400 rounded-full animate-pulse"
                style={{
                  width: ball.radius * 2 + 8,
                  height: ball.radius * 2 + 8,
                  transform: "translate(-50%, -50%)",
                }}
              />
            )}
          </div>
        ))}

        {/* False positives */}
        {falsePositives.map((fp, i) => (
          <div
            key={`fp-${i}`}
            className="absolute border-2 border-red-500 rounded-full"
            style={{
              left: fp.x,
              top: fp.y,
              width: fp.radius * 2 + 8,
              height: fp.radius * 2 + 8,
              transform: "translate(-50%, -50%)",
            }}
          >
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-red-500">
              FP
            </span>
          </div>
        ))}

        {/* Legend */}
        <div className="absolute bottom-2 right-2 bg-black/50 rounded p-2 text-xs text-white">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 border-2 border-green-400 rounded-full" />
            <span>Detected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-red-500 rounded-full" />
            <span>False Positive</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 text-center">
        <div className="bg-fd-secondary p-2 rounded">
          <div className="text-lg font-bold text-green-500">
            {truePositives}/{totalBalls}
          </div>
          <div className="text-xs text-fd-muted-foreground">Detected</div>
        </div>
        <div className="bg-fd-secondary p-2 rounded">
          <div className="text-lg font-bold text-red-500">
            {falsePositives.length}
          </div>
          <div className="text-xs text-fd-muted-foreground">
            False Positives
          </div>
        </div>
        <div className="bg-fd-secondary p-2 rounded">
          <div className="text-lg font-bold">
            {((truePositives / totalBalls) * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-fd-muted-foreground">Recall</div>
        </div>
        <div className="bg-fd-secondary p-2 rounded">
          <div className="text-lg font-bold text-blue-500">{fps} FPS</div>
          <div className="text-xs text-fd-muted-foreground">Speed</div>
        </div>
      </div>
    </div>
  );
}
