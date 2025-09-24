import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslation } from '../i18n';
import { CameraIcon, XCircleIcon } from './Icons';

interface WebcamCaptureProps {
  onClose: () => void;
  onCapture: (file: File) => void;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onClose, onCapture }) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `webcam-${Date.now()}.png`, { type: 'image/png' });
          onCapture(file);
          stopCamera();
        }
      }, 'image/png');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        {error ? (
          <div className="text-center text-red-500">
            <XCircleIcon className="w-12 h-12 mx-auto mb-4" />
            <p>{error}</p>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-md aspect-video bg-gray-900"></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleCapture}
                className="p-4 bg-purple-600 text-white rounded-full hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                title={t('capture')}
              >
                <CameraIcon className="w-8 h-8" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WebcamCapture;