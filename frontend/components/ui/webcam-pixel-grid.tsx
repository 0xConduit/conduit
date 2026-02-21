"use client";
import React, { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { WebcamPixelGridProps, PixelData } from "./pixel-grid/types";
import { useWebcam } from "./pixel-grid/useWebcam";
import { processFrame, renderToCanvas } from "./pixel-grid/renderGrid";
import { CameraErrorPortal } from "./pixel-grid/CameraErrorPortal";

export const WebcamPixelGrid: React.FC<WebcamPixelGridProps> = ({
  gridCols = 64,
  gridRows = 48,
  maxElevation = 15,
  motionSensitivity = 0.4,
  elevationSmoothing = 0.1,
  colorMode = "webcam",
  monochromeColor = "#00ff88",
  backgroundColor = "#0a0a0a",
  mirror = true,
  gapRatio = 0.1,
  invertColors = false,
  darken = 0,
  borderColor = "#ffffff",
  borderOpacity = 0.08,
  className,
  onWebcamError,
  onWebcamReady,
}) => {
  const { videoRef, isReady, error, showErrorPopup, setShowErrorPopup, requestCameraAccess } =
    useWebcam({ onWebcamError, onWebcamReady });

  const processingCanvasRef = useRef<HTMLCanvasElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const previousFrameRef = useRef<Uint8ClampedArray | null>(null);
  const pixelDataRef = useRef<PixelData[][]>([]);
  const animationRef = useRef<number>(0);

  const monoRGB = React.useMemo(() => {
    const hex = monochromeColor.replace("#", "");
    return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
  }, [monochromeColor]);

  const borderRGB = React.useMemo(() => {
    const hex = borderColor.replace("#", "");
    return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
  }, [borderColor]);

  useEffect(() => {
    pixelDataRef.current = Array.from({ length: gridRows }, () =>
      Array.from({ length: gridCols }, () => ({ r: 30, g: 30, b: 30, motion: 0, targetElevation: 0, currentElevation: 0 })),
    );
  }, [gridCols, gridRows]);

  const render = useCallback(() => {
    const video = videoRef.current;
    const processingCanvas = processingCanvasRef.current;
    const displayCanvas = displayCanvasRef.current;

    if (!video || !processingCanvas || !displayCanvas || video.readyState < 2) {
      animationRef.current = requestAnimationFrame(render);
      return;
    }

    const procCtx = processingCanvas.getContext("2d", { willReadFrequently: true });
    const dispCtx = displayCanvas.getContext("2d");
    if (!procCtx || !dispCtx) { animationRef.current = requestAnimationFrame(render); return; }

    processingCanvas.width = gridCols;
    processingCanvas.height = gridRows;

    procCtx.save();
    if (mirror) {
      procCtx.scale(-1, 1);
      procCtx.drawImage(video, -gridCols, 0, gridCols, gridRows);
    } else {
      procCtx.drawImage(video, 0, 0, gridCols, gridRows);
    }
    procCtx.restore();

    const imageData = procCtx.getImageData(0, 0, gridCols, gridRows);
    const pixels = pixelDataRef.current;

    processFrame(imageData.data, previousFrameRef.current, pixels, {
      gridCols, gridRows, motionSensitivity, colorMode, monoRGB, invertColors, darken, maxElevation, elevationSmoothing,
    });

    previousFrameRef.current = new Uint8ClampedArray(imageData.data);

    renderToCanvas(dispCtx, displayCanvas, pixels, {
      gridCols, gridRows, backgroundColor, gapRatio, borderRGB, borderOpacity,
    });

    animationRef.current = requestAnimationFrame(render);
  }, [gridCols, gridRows, mirror, motionSensitivity, colorMode, monoRGB, maxElevation, elevationSmoothing, backgroundColor, gapRatio, invertColors, darken, borderRGB, borderOpacity, videoRef]);

  useEffect(() => {
    if (!isReady) return;
    animationRef.current = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(animationRef.current); };
  }, [isReady, render]);

  return (
    <div className={cn("relative h-full w-full", className)}>
      <video ref={videoRef} className="pointer-events-none absolute h-0 w-0 opacity-0" playsInline muted />
      <canvas ref={processingCanvasRef} className="pointer-events-none absolute h-0 w-0 opacity-0" />
      <canvas
        ref={displayCanvasRef}
        className={cn("h-full w-full transition-opacity duration-1000", isReady ? "opacity-100" : "opacity-0")}
        style={{ backgroundColor }}
      />
      <CameraErrorPortal
        error={error}
        showErrorPopup={showErrorPopup}
        setShowErrorPopup={setShowErrorPopup}
        requestCameraAccess={requestCameraAccess}
      />
    </div>
  );
};

export default WebcamPixelGrid;
