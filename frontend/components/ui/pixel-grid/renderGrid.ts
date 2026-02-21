import type { PixelData, RenderConfig } from "./types";

/**
 * Process a video frame: detect motion and compute pixel colors/elevations.
 */
export function processFrame(
  currentData: Uint8ClampedArray,
  previousData: Uint8ClampedArray | null,
  pixels: PixelData[][],
  config: Pick<RenderConfig, "gridCols" | "gridRows" | "motionSensitivity" | "colorMode" | "monoRGB" | "invertColors" | "darken" | "maxElevation" | "elevationSmoothing">,
): void {
  const { gridCols, gridRows, motionSensitivity, colorMode, monoRGB, invertColors, darken, maxElevation, elevationSmoothing } = config;

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const idx = (row * gridCols + col) * 4;
      const r = currentData[idx];
      const g = currentData[idx + 1];
      const b = currentData[idx + 2];

      const pixel = pixels[row]?.[col];
      if (!pixel) continue;

      // Calculate motion
      let motion = 0;
      if (previousData) {
        const prevR = previousData[idx];
        const prevG = previousData[idx + 1];
        const prevB = previousData[idx + 2];
        const diff =
          Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB);
        motion = Math.min(1, diff / 255 / motionSensitivity);
      }

      // Smooth motion
      pixel.motion = pixel.motion * 0.7 + motion * 0.3;

      // Set colors
      let finalR = r;
      let finalG = g;
      let finalB = b;

      if (colorMode === "monochrome") {
        const brightness = (r + g + b) / 3 / 255;
        finalR = Math.round(monoRGB.r * brightness);
        finalG = Math.round(monoRGB.g * brightness);
        finalB = Math.round(monoRGB.b * brightness);
      }

      if (invertColors) {
        finalR = 255 - finalR;
        finalG = 255 - finalG;
        finalB = 255 - finalB;
      }

      if (darken > 0) {
        const darkenFactor = 1 - darken;
        finalR = Math.round(finalR * darkenFactor);
        finalG = Math.round(finalG * darkenFactor);
        finalB = Math.round(finalB * darkenFactor);
      }

      pixel.r = finalR;
      pixel.g = finalG;
      pixel.b = finalB;

      pixel.targetElevation = pixel.motion * maxElevation;
      pixel.currentElevation +=
        (pixel.targetElevation - pixel.currentElevation) * elevationSmoothing;
    }
  }
}

/**
 * Render pixel data to a display canvas with 3D isometric effect.
 */
export function renderToCanvas(
  dispCtx: CanvasRenderingContext2D,
  displayCanvas: HTMLCanvasElement,
  pixels: PixelData[][],
  config: Pick<RenderConfig, "gridCols" | "gridRows" | "backgroundColor" | "gapRatio" | "borderRGB" | "borderOpacity">,
): void {
  const { gridCols, gridRows, backgroundColor, gapRatio, borderRGB, borderOpacity } = config;

  const dpr = window.devicePixelRatio || 1;
  const displayWidth = displayCanvas.clientWidth;
  const displayHeight = displayCanvas.clientHeight;

  displayCanvas.width = displayWidth * dpr;
  displayCanvas.height = displayHeight * dpr;
  dispCtx.scale(dpr, dpr);

  dispCtx.fillStyle = backgroundColor;
  dispCtx.fillRect(0, 0, displayWidth, displayHeight);

  const cellSize = Math.max(displayWidth / gridCols, displayHeight / gridRows);
  const gap = cellSize * gapRatio;

  const gridWidth = cellSize * gridCols;
  const gridHeight = cellSize * gridRows;
  const offsetXGrid = (displayWidth - gridWidth) / 2;
  const offsetYGrid = (displayHeight - gridHeight) / 2;

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const pixel = pixels[row]?.[col];
      if (!pixel) continue;

      const x = offsetXGrid + col * cellSize;
      const y = offsetYGrid + row * cellSize;
      const elevation = pixel.currentElevation;

      const offsetX = -elevation * 1.2;
      const offsetY = -elevation * 1.8;

      // Shadow
      if (elevation > 0.5) {
        dispCtx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.6, elevation * 0.04)})`;
        dispCtx.fillRect(
          x + gap / 2 + elevation * 1.5,
          y + gap / 2 + elevation * 2.0,
          cellSize - gap,
          cellSize - gap,
        );
      }

      // 3D side faces
      if (elevation > 0.5) {
        // Right side
        dispCtx.fillStyle = `rgb(${Math.max(0, pixel.r - 80)}, ${Math.max(0, pixel.g - 80)}, ${Math.max(0, pixel.b - 80)})`;
        dispCtx.beginPath();
        dispCtx.moveTo(x + cellSize - gap / 2 + offsetX, y + gap / 2 + offsetY);
        dispCtx.lineTo(x + cellSize - gap / 2, y + gap / 2);
        dispCtx.lineTo(x + cellSize - gap / 2, y + cellSize - gap / 2);
        dispCtx.lineTo(x + cellSize - gap / 2 + offsetX, y + cellSize - gap / 2 + offsetY);
        dispCtx.closePath();
        dispCtx.fill();

        // Bottom side
        dispCtx.fillStyle = `rgb(${Math.max(0, pixel.r - 50)}, ${Math.max(0, pixel.g - 50)}, ${Math.max(0, pixel.b - 50)})`;
        dispCtx.beginPath();
        dispCtx.moveTo(x + gap / 2 + offsetX, y + cellSize - gap / 2 + offsetY);
        dispCtx.lineTo(x + gap / 2, y + cellSize - gap / 2);
        dispCtx.lineTo(x + cellSize - gap / 2, y + cellSize - gap / 2);
        dispCtx.lineTo(x + cellSize - gap / 2 + offsetX, y + cellSize - gap / 2 + offsetY);
        dispCtx.closePath();
        dispCtx.fill();
      }

      // Top face
      const brightness = 1 + elevation * 0.05;
      dispCtx.fillStyle = `rgb(${Math.min(255, Math.round(pixel.r * brightness))}, ${Math.min(255, Math.round(pixel.g * brightness))}, ${Math.min(255, Math.round(pixel.b * brightness))})`;
      dispCtx.fillRect(
        x + gap / 2 + offsetX,
        y + gap / 2 + offsetY,
        cellSize - gap,
        cellSize - gap,
      );

      // Border
      dispCtx.strokeStyle = `rgba(${borderRGB.r}, ${borderRGB.g}, ${borderRGB.b}, ${borderOpacity + elevation * 0.008})`;
      dispCtx.lineWidth = 0.5;
      dispCtx.strokeRect(
        x + gap / 2 + offsetX,
        y + gap / 2 + offsetY,
        cellSize - gap,
        cellSize - gap,
      );
    }
  }
}
