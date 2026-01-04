"use client";

import { useState, useMemo } from "react";

type FilterType =
  | "original"
  | "grayscale"
  | "blur"
  | "edge"
  | "threshold"
  | "morphology";

// Simulate a simple image as a 2D array of pixel values
const generateSampleImage = () => {
  const width = 16;
  const height = 12;
  const pixels: number[][] = [];

  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      // Create a pattern with a ball-like shape
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

      if (dist < 3) {
        row.push(255); // Ball center - bright
      } else if (dist < 5) {
        row.push(180); // Ball edge
      } else {
        row.push(50 + Math.random() * 30); // Background with noise
      }
    }
    pixels.push(row);
  }
  return pixels;
};

// Simple filter implementations
const applyFilter = (
  pixels: number[][],
  filter: FilterType,
  params: Record<string, number>
): number[][] => {
  const height = pixels.length;
  const width = pixels[0].length;
  const result: number[][] = pixels.map((row) => [...row]);

  switch (filter) {
    case "grayscale":
      // Already grayscale
      return result;

    case "blur": {
      const kernel = params.kernelSize || 3;
      const half = Math.floor(kernel / 2);
      for (let y = half; y < height - half; y++) {
        for (let x = half; x < width - half; x++) {
          let sum = 0;
          let count = 0;
          for (let ky = -half; ky <= half; ky++) {
            for (let kx = -half; kx <= half; kx++) {
              sum += pixels[y + ky][x + kx];
              count++;
            }
          }
          result[y][x] = sum / count;
        }
      }
      return result;
    }

    case "edge": {
      // Sobel edge detection
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const gx =
            -pixels[y - 1][x - 1] +
            pixels[y - 1][x + 1] +
            -2 * pixels[y][x - 1] +
            2 * pixels[y][x + 1] +
            -pixels[y + 1][x - 1] +
            pixels[y + 1][x + 1];
          const gy =
            -pixels[y - 1][x - 1] -
            2 * pixels[y - 1][x] -
            pixels[y - 1][x + 1] +
            pixels[y + 1][x - 1] +
            2 * pixels[y + 1][x] +
            pixels[y + 1][x + 1];
          result[y][x] = Math.min(255, Math.sqrt(gx * gx + gy * gy));
        }
      }
      return result;
    }

    case "threshold": {
      const thresh = params.threshold || 128;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          result[y][x] = pixels[y][x] > thresh ? 255 : 0;
        }
      }
      return result;
    }

    case "morphology": {
      // Simple erosion/dilation
      const op = params.operation || 0; // 0 = erosion, 1 = dilation
      const kernel = 3;
      const half = Math.floor(kernel / 2);

      for (let y = half; y < height - half; y++) {
        for (let x = half; x < width - half; x++) {
          let values: number[] = [];
          for (let ky = -half; ky <= half; ky++) {
            for (let kx = -half; kx <= half; kx++) {
              values.push(pixels[y + ky][x + kx]);
            }
          }
          result[y][x] = op === 0 ? Math.min(...values) : Math.max(...values);
        }
      }
      return result;
    }

    default:
      return result;
  }
};

export function ImageFilterDemo() {
  const [filter, setFilter] = useState<FilterType>("original");
  const [params, setParams] = useState({
    kernelSize: 3,
    threshold: 128,
    operation: 0,
  });

  const originalImage = useMemo(() => generateSampleImage(), []);
  const filteredImage = useMemo(
    () => applyFilter(originalImage, filter, params),
    [originalImage, filter, params]
  );

  const renderPixelGrid = (pixels: number[][], scale: number = 20) => (
    <div
      className="inline-grid gap-px bg-gray-800 p-1 rounded"
      style={{ gridTemplateColumns: `repeat(${pixels[0].length}, ${scale}px)` }}
    >
      {pixels.flat().map((value, i) => (
        <div
          key={i}
          className="rounded-sm"
          style={{
            width: scale,
            height: scale,
            backgroundColor: `rgb(${value}, ${value}, ${value})`,
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="my-6 p-4 border rounded-lg bg-fd-card">
      <h3 className="text-lg font-semibold mb-4">🖼️ Image Filter Demo</h3>

      {/* Filter Selection */}
      <div className="mb-4">
        <span className="text-sm font-medium mr-2">Filter:</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {(
            [
              "original",
              "blur",
              "edge",
              "threshold",
              "morphology",
            ] as FilterType[]
          ).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded ${
                filter === f
                  ? "bg-fd-primary text-fd-primary-foreground"
                  : "bg-fd-secondary hover:bg-fd-accent"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Parameters */}
      {filter === "blur" && (
        <div className="mb-4">
          <label className="text-sm">Kernel Size: {params.kernelSize}</label>
          <input
            type="range"
            min="3"
            max="7"
            step="2"
            value={params.kernelSize}
            onChange={(e) =>
              setParams((p) => ({ ...p, kernelSize: parseInt(e.target.value) }))
            }
            className="w-full"
          />
        </div>
      )}

      {filter === "threshold" && (
        <div className="mb-4">
          <label className="text-sm">Threshold: {params.threshold}</label>
          <input
            type="range"
            min="0"
            max="255"
            value={params.threshold}
            onChange={(e) =>
              setParams((p) => ({ ...p, threshold: parseInt(e.target.value) }))
            }
            className="w-full"
          />
        </div>
      )}

      {filter === "morphology" && (
        <div className="mb-4">
          <label className="text-sm mr-4">Operation:</label>
          <button
            onClick={() => setParams((p) => ({ ...p, operation: 0 }))}
            className={`px-2 py-1 text-xs rounded mr-2 ${
              params.operation === 0
                ? "bg-fd-primary text-fd-primary-foreground"
                : "bg-fd-secondary"
            }`}
          >
            Erosion
          </button>
          <button
            onClick={() => setParams((p) => ({ ...p, operation: 1 }))}
            className={`px-2 py-1 text-xs rounded ${
              params.operation === 1
                ? "bg-fd-primary text-fd-primary-foreground"
                : "bg-fd-secondary"
            }`}
          >
            Dilation
          </button>
        </div>
      )}

      {/* Image Display */}
      <div className="flex flex-wrap gap-6 justify-center mb-4">
        <div className="text-center">
          <div className="text-xs text-fd-muted-foreground mb-2">Original</div>
          {renderPixelGrid(originalImage)}
        </div>
        <div className="text-center">
          <div className="text-xs text-fd-muted-foreground mb-2">
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </div>
          {renderPixelGrid(filteredImage)}
        </div>
      </div>

      {/* Code Example */}
      <div className="bg-fd-secondary p-3 rounded font-mono text-xs">
        <div className="text-fd-muted-foreground mb-1">
          # OpenCV equivalent:
        </div>
        {filter === "blur" && (
          <div>
            result = cv2.GaussianBlur(image, ({params.kernelSize},{" "}
            {params.kernelSize}), 0)
          </div>
        )}
        {filter === "edge" && <div>result = cv2.Canny(image, 50, 150)</div>}
        {filter === "threshold" && (
          <div>
            _, result = cv2.threshold(image, {params.threshold}, 255,
            cv2.THRESH_BINARY)
          </div>
        )}
        {filter === "morphology" && (
          <div>
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
            <br />
            result = cv2.{params.operation === 0 ? "erode" : "dilate"}(image,
            kernel)
          </div>
        )}
        {filter === "original" && <div>result = image.copy()</div>}
      </div>
    </div>
  );
}
