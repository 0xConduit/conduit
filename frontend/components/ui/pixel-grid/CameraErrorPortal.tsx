"use client";
import { createPortal } from "react-dom";

interface CameraErrorPortalProps {
  error: string | null;
  showErrorPopup: boolean;
  setShowErrorPopup: (show: boolean) => void;
  requestCameraAccess: () => void;
}

export function CameraErrorPortal({
  error,
  showErrorPopup,
  setShowErrorPopup,
  requestCameraAccess,
}: CameraErrorPortalProps) {
  if (!error || typeof document === "undefined") return null;

  if (showErrorPopup) {
    return createPortal(
      <div className="animate-in fade-in slide-in-from-top-2 pointer-events-auto fixed top-20 right-4 z-[9999] duration-300">
        <div className="relative flex max-w-sm items-start gap-3 rounded-lg border border-white/10 bg-black/80 p-4 shadow-2xl backdrop-blur-xl">
          <button
            onClick={() => setShowErrorPopup(false)}
            className="absolute top-2 right-2 rounded-md p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
            <svg className="h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>

          <div className="flex-1 pr-4">
            <p className="text-sm font-medium text-white/90">Camera access needed</p>
            <p className="mt-1 text-xs text-white/50">Enable camera for the interactive background effect</p>
            <button
              onClick={requestCameraAccess}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Enable Camera
            </button>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <button
      onClick={() => setShowErrorPopup(true)}
      className="pointer-events-auto fixed top-20 right-4 z-[9999] flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/50 shadow-lg backdrop-blur-xl transition-all hover:scale-105 hover:bg-black/80 hover:text-white/80"
      title="Camera access required"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3l18 18"
          className="text-red-400"
          stroke="currentColor"
        />
      </svg>
    </button>,
    document.body,
  );
}
