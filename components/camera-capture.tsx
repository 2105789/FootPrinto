"use client";

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, AlertCircle } from 'lucide-react';
import { ImageViewer } from './image-viewer';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment'); // Default to back camera
  const [isSwitching, setIsSwitching] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Detect if device is mobile on component mount
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
  }, []);

  // Effect to handle camera initialization when facingMode changes
  useEffect(() => {
    if (isStreaming || isSwitching) {
      startCamera();
    }
  }, [facingMode]);

  const startCamera = async () => {
    try {
      setError(null);
      setCapturedImage(null);
      
      // Stop any existing stream first
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      setIsSwitching(true);

      // Different constraints for mobile vs desktop
      let constraints: MediaStreamConstraints;
      
      if (isMobile) {
        // Mobile devices - try with exact constraint first
        constraints = {
          video: { 
            facingMode: { exact: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
      } else {
        // Desktop - simpler constraints
        constraints = {
          video: { 
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsStreaming(true);
        }
      } catch (exactError) {
        console.warn('Failed with primary constraints, trying fallback:', exactError);
        
        // Fallback to non-exact constraint if exact fails
        const fallbackConstraints: MediaStreamConstraints = {
          video: { facingMode: facingMode }
        };
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setIsStreaming(true);
          }
        } catch (fallbackError) {
          console.error('Failed with fallback constraints:', fallbackError);
          
          // Last resort - try with no facingMode constraint at all
          try {
            const basicStream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
              videoRef.current.srcObject = basicStream;
              setIsStreaming(true);
              setError("Camera switching may not work on this device. You can still capture images.");
            }
          } catch (basicError) {
            throw basicError; // If this fails, we're out of options
          }
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Failed to access camera. Please check your camera permissions and try again.');
      setIsStreaming(false);
    } finally {
      setIsSwitching(false);
    }
  };

  const switchCamera = () => {
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Flip the image horizontally if using front camera
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
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
      setError(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!capturedImage ? (
        <div className="relative w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
          {isSwitching && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
              Switching camera...
            </div>
          )}
        </div>
      ) : (
        <div 
          className="relative w-full max-w-md aspect-video cursor-pointer"
          onClick={() => setIsFullScreen(true)}
        >
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      )}
      
      {error && (
        <div className="w-full max-w-md p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-sm flex items-center">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="flex gap-2">
        {!isStreaming ? (
          <Button onClick={startCamera} disabled={isSwitching}>
            <Camera className="mr-2 h-4 w-4" />
            {capturedImage ? 'Retake Photo' : 'Start Camera'}
          </Button>
        ) : (
          <>
            <Button onClick={captureImage} variant="default" disabled={isSwitching}>Capture</Button>
            <Button onClick={stopCamera} variant="destructive" disabled={isSwitching}>Stop Camera</Button>
            <Button onClick={switchCamera} variant="secondary" disabled={isSwitching}>
              <RotateCcw className="mr-2 h-4 w-4"/> Switch
            </Button>
          </>
        )}
      </div>
      
      {isMobile && (
        <p className="text-xs text-gray-500 text-center mt-2">
          Tip: If camera switching doesn't work, try stopping the camera first, then starting it again.
        </p>
      )}

      {isFullScreen && capturedImage && (
        <ImageViewer
          imageUrl={capturedImage}
          onClose={() => setIsFullScreen(false)}
        />
      )}
    </div>
  );
}
