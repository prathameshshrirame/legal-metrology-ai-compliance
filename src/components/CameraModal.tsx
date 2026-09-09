import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Upload } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (mode: 'environment' | 'user') => {
    setIsStarting(true);
    setCameraError(null);
    stopStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera streaming API is not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStarting(false);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setIsStarting(false);
      setCameraError(
        err?.message ||
          'Unable to access camera directly. Please grant camera permission or use the mobile photo capture button below.'
      );
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]);

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    stopStream();
    onCapture(dataUrl);
    onClose();
  };

  const handleNativeFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        stopStream();
        onCapture(reader.result);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center space-x-2 text-white">
            <Camera className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-semibold">Package Label Camera</span>
          </div>
          <button
            id="camera-close-button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-slate-300 max-w-sm">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">Direct Camera Unavailable</p>
              <p className="text-xs text-slate-400 mb-4">{cameraError}</p>
              <button
                id="camera-fallback-file-button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-lg cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" />
                <span>Snap via Mobile Device Camera</span>
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Target Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="w-full h-full border-2 border-dashed border-blue-400/70 rounded-xl relative flex flex-col justify-between p-3 bg-blue-500/5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-semibold bg-blue-900/90 text-blue-200 px-2 py-0.5 rounded shadow">
                      ALIGN STATUTORY LABEL
                    </span>
                    <span className="text-[11px] text-slate-300 bg-black/60 px-2 py-0.5 rounded">
                      Ensure MRP & Date visible
                    </span>
                  </div>

                  {/* Crosshair corners */}
                  <div className="w-8 h-8 border-t-2 border-l-2 border-white absolute top-0 left-0" />
                  <div className="w-8 h-8 border-t-2 border-r-2 border-white absolute top-0 right-0" />
                  <div className="w-8 h-8 border-b-2 border-l-2 border-white absolute bottom-0 left-0" />
                  <div className="w-8 h-8 border-b-2 border-r-2 border-white absolute bottom-0 right-0" />

                  <div className="text-center">
                    <span className="text-[11px] text-white/90 bg-black/70 px-2.5 py-1 rounded-full shadow">
                      Hold steady for clear OCR
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {isStarting && !cameraError && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-slate-300">
              <RefreshCw className="w-6 h-6 animate-spin mr-2 text-blue-400" />
              <span className="text-sm">Initializing camera stream...</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between">
          <button
            id="camera-flip-button"
            type="button"
            onClick={toggleFacingMode}
            disabled={!!cameraError || isStarting}
            className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 transition cursor-pointer"
            title="Switch Camera (Front/Back)"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Shutter Button */}
          <button
            id="camera-shutter-button"
            type="button"
            onClick={capturePhoto}
            disabled={!!cameraError || isStarting}
            className="w-16 h-16 rounded-full border-4 border-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 flex items-center justify-center shadow-lg shadow-blue-500/40 active:scale-95 transition cursor-pointer"
            title="Take Photo"
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <Camera className="w-5 h-5 text-blue-600" />
            </div>
          </button>

          {/* Mobile direct photo file picker */}
          <button
            id="camera-native-input-button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            title="Use device gallery or camera app"
          >
            <Upload className="w-5 h-5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleNativeFileInput}
          />
        </div>
      </div>
    </div>
  );
};
