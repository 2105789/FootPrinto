import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { ImageViewer } from './image-viewer';

interface ImageInputProps {
  onCapture?: (imageData: string) => void;
  maxSizeMB?: number;
}

export function ImageInput({ onCapture, maxSizeMB = 5 }: ImageInputProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);
    
    if (file) {
      // Check file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB) {
        setError(`File size must be less than ${maxSizeMB}MB`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const base64String = (reader.result as string).split(',')[1];
          setSelectedImage(reader.result as string);
          onCapture?.(base64String);
        } catch (err) {
          setError('Error processing image. Please try again.');
          console.error('Error processing image:', err);
        }
      };

      reader.onerror = () => {
        setError('Error reading file. Please try again.');
        console.error('FileReader error:', reader.error);
      };

      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4">
        <Button 
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Image
        </Button>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
      {selectedImage && (
        <div 
          className="relative w-full max-w-md mx-auto aspect-video cursor-pointer"
          onClick={() => setIsFullScreen(true)}
        >
          <img
            src={selectedImage}
            alt="Selected"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      )}
      {isFullScreen && selectedImage && (
        <ImageViewer
          imageUrl={selectedImage}
          onClose={() => setIsFullScreen(false)}
        />
      )}
    </div>
  );
}

export default ImageInput;