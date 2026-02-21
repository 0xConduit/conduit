import { useRef, useState, useCallback, useEffect } from "react";

export function useWebcam({
  onWebcamError,
  onWebcamReady,
}: {
  onWebcamError?: (error: Error) => void;
  onWebcamReady?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorPopup, setShowErrorPopup] = useState(true);

  const requestCameraAccess = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsReady(true);
        setError(null);
        setShowErrorPopup(false);
        onWebcamReady?.();
      }
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Webcam access denied");
      setError(error.message);
      onWebcamError?.(error);
    }
  }, [onWebcamError, onWebcamReady]);

  // Initialize webcam on mount
  useEffect(() => {
    requestCameraAccess();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [requestCameraAccess]);

  return {
    videoRef,
    isReady,
    error,
    showErrorPopup,
    setShowErrorPopup,
    requestCameraAccess,
  };
}
