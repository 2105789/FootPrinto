"use client";

import { X } from 'lucide-react';

interface ImageViewerProps {
  imageUrl: string;
  onClose: () => void;
}

export function ImageViewer({ imageUrl, onClose }: ImageViewerProps) {
  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
      onClick={onClose}
    >
      <button 
        className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
        onClick={onClose}
      >
        <X className="h-8 w-8" />
      </button>
      
      <div 
        className="max-w-[90vw] max-h-[90vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Full screen view"
          className="max-w-full max-h-[90vh] object-contain"
        />
      </div>
    </div>
  );
} 