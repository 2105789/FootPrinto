"use client";

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user'); // 'user' for front, 'environment' for back

  const startCamera = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          video: { facingMode: facingMode }, // Set the facing mode
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsStreaming(true);
        }
      } catch (error) {
          console.error('Error accessing camera:', error);
      }
    };

    const switchCamera = () => {
        stopCamera();
        setFacingMode(facingMode === 'user' ? 'environment' : 'user');
        setTimeout(startCamera, 100); // small delay to allow stopCamera to complete
    };


  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        onCapture(imageData.split(',')[1]); // Remove data URL prefix
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };


  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex gap-2">
        {!isStreaming ? (
          <Button onClick={startCamera}>
            <Camera className="mr-2 h-4 w-4" />
            Start Camera
          </Button>
        ) : (
          <>
            <Button onClick={captureImage} variant="default">Capture</Button>
            <Button onClick={stopCamera} variant="destructive">Stop Camera</Button>
            <Button onClick={switchCamera} variant="secondary">
                <RotateCcw className="mr-2 h-4 w-4"/> Switch
                </Button>
          </>
        )}
      </div>
    </div>
  );
}
