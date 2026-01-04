"use client";

import { useState, useCallback } from "react";

interface HSVValues {
  hLow: number;
  hHigh: number;
  sLow: number;
  sHigh: number;
  vLow: number;
  vHigh: number;
}

const presets: Record<string, HSVValues> = {
  orange_ball: {
    hLow: 5,
    hHigh: 15,
    sLow: 100,
    sHigh: 255,
    vLow: 100,
    vHigh: 255,
  },
  green_field: {
    hLow: 35,
    hHigh: 85,
    sLow: 50,
    sHigh: 255,
    vLow: 50,
    vHigh: 255,
  },
  white_lines: {
    hLow: 0,
    hHigh: 180,
    sLow: 0,
    sHigh: 30,
    vLow: 200,
    vHigh: 255,
  },
  red: { hLow: 0, hHigh: 10, sLow: 100, sHigh: 255, vLow: 100, vHigh: 255 },
  blue: { hLow: 100, hHigh: 130, sLow: 100, sHigh: 255, vLow: 100, vHigh: 255 },
};

// Generate sample pixels for visualization
const generatePixels = (count: number) => {
  const pixels = [];
  for (let i = 0; i < count; i++) {
    pixels.push({
      h: Math.floor(Math.random() * 180),
      s: Math.floor(Math.random() * 256),
      v: Math.floor(Math.random() * 256),
    });
  }
  return pixels;
};

// Convert HSV to RGB for display
const hsvToRgb = (h: number, s: number, v: number): string => {
  const hNorm = h / 180;
  const sNorm = s / 255;
  const vNorm = v / 255;

  const i = Math.floor(hNorm * 6);
  const f = hNorm * 6 - i;
  const p = vNorm * (1 - sNorm);
  const q = vNorm * (1 - f * sNorm);
  const t = vNorm * (1 - (1 - f) * sNorm);

  let r = 0,
    g = 0,
    b = 0;
  switch (i % 6) {
    case 0:
      r = vNorm;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = vNorm;
      b = p;
      break;
    case 2:
      r = p;
      g = vNorm;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = vNorm;
      break;
    case 4:
      r = t;
      g = p;
      b = vNorm;
      break;
    case 5:
      r = vNorm;
      g = p;
      b = q;
      break;
  }

  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(
    b * 255
  )})`;
};

export function HSVTuner() {
  const [values, setValues] = useState<HSVValues>(presets.orange_ball);
  const [pixels] = useState(() => generatePixels(200));

  const updateValue = useCallback((key: keyof HSVValues, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const loadPreset = useCallback((presetName: string) => {
    if (presets[presetName]) {
      setValues(presets[presetName]);
    }
  }, []);

  const isInRange = (pixel: { h: number; s: number; v: number }) => {
    return (
      pixel.h >= values.hLow &&
      pixel.h <= values.hHigh &&
      pixel.s >= values.sLow &&
      pixel.s <= values.sHigh &&
      pixel.v >= values.vLow &&
      pixel.v <= values.vHigh
    );
  };

  const matchedCount = pixels.filter(isInRange).length;

  return (
    <div className="my-6 p-4 border rounded-lg bg-fd-card">
      <h3 className="text-lg font-semibold mb-4">🎨 Interactive HSV Tuner</h3>

      {/* Presets */}
      <div className="mb-4">
        <span className="text-sm text-fd-muted-foreground mr-2">Presets:</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {Object.keys(presets).map((preset) => (
            <button
              key={preset}
              onClick={() => loadPreset(preset)}
              className="px-3 py-1 text-xs rounded-full bg-fd-secondary hover:bg-fd-accent transition-colors"
            >
              {preset.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* HSV Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Hue */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Hue (0-180)</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="180"
              value={values.hLow}
              onChange={(e) => updateValue("hLow", parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="w-10 text-sm text-center">{values.hLow}</span>
            <span className="text-sm">-</span>
            <input
              type="range"
              min="0"
              max="180"
              value={values.hHigh}
              onChange={(e) => updateValue("hHigh", parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="w-10 text-sm text-center">{values.hHigh}</span>
          </div>
          {/* Hue gradient preview */}
          <div
            className="h-4 rounded"
            style={{
              background:
                "linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)",
            }}
          />
        </div>

        {/* Saturation */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Saturation (0-255)</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="255"
              value={values.sLow}
              onChange={(e) => updateValue("sLow", parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="w-10 text-sm text-center">{values.sLow}</span>
            <span className="text-sm">-</span>
            <input
              type="range"
              min="0"
              max="255"
              value={values.sHigh}
              onChange={(e) => updateValue("sHigh", parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="w-10 text-sm text-center">{values.sHigh}</span>
          </div>
        </div>

        {/* Value */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Value/Brightness (0-255)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="255"
              value={values.vLow}
              onChange={(e) => updateValue("vLow", parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="w-10 text-sm text-center">{values.vLow}</span>
            <span className="text-sm">-</span>
            <input
              type="range"
              min="0"
              max="255"
              value={values.vHigh}
              onChange={(e) => updateValue("vHigh", parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="w-10 text-sm text-center">{values.vHigh}</span>
          </div>
        </div>

        {/* Color Preview */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Selected Color Range</label>
          <div className="flex gap-2">
            <div
              className="flex-1 h-12 rounded border"
              style={{
                backgroundColor: hsvToRgb(
                  values.hLow,
                  values.sLow,
                  values.vLow
                ),
              }}
            >
              <span className="text-xs p-1 text-white mix-blend-difference">
                Low
              </span>
            </div>
            <div
              className="flex-1 h-12 rounded border"
              style={{
                backgroundColor: hsvToRgb(
                  values.hHigh,
                  values.sHigh,
                  values.vHigh
                ),
              }}
            >
              <span className="text-xs p-1 text-white mix-blend-difference">
                High
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pixel Visualization */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">
            Sample Pixels (matched: {matchedCount}/{pixels.length})
          </span>
          <span className="text-xs text-fd-muted-foreground">
            {((matchedCount / pixels.length) * 100).toFixed(1)}% matched
          </span>
        </div>
        <div className="grid grid-cols-20 gap-0.5 p-2 bg-fd-secondary rounded">
          {pixels.map((pixel, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-sm transition-opacity ${
                isInRange(pixel) ? "ring-1 ring-green-500" : "opacity-30"
              }`}
              style={{ backgroundColor: hsvToRgb(pixel.h, pixel.s, pixel.v) }}
              title={`H:${pixel.h} S:${pixel.s} V:${pixel.v}`}
            />
          ))}
        </div>
      </div>

      {/* Code Output */}
      <div className="bg-fd-secondary p-3 rounded font-mono text-sm">
        <div className="text-fd-muted-foreground mb-1">
          # Python/OpenCV code:
        </div>
        <div>
          lower_hsv = np.array([{values.hLow}, {values.sLow}, {values.vLow}])
        </div>
        <div>
          upper_hsv = np.array([{values.hHigh}, {values.sHigh}, {values.vHigh}])
        </div>
        <div className="mt-2">
          mask = cv2.inRange(hsv_image, lower_hsv, upper_hsv)
        </div>
      </div>
    </div>
  );
}
