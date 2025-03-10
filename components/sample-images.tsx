"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageViewer } from './image-viewer';

// Sample images with their descriptions
const sampleImages = [
  {
    id: 1,
    name: 'Coffee Cup',
    description: 'A cup of coffee on a wooden table',
    category: 'Beverages',
    objects: ['Coffee cup', 'Coffee', 'Wooden table'],
    src: '/sample-images/coffee.jpg'
  },
  {
    id: 2,
    name: 'Laptop Computer',
    description: 'A modern laptop computer',
    category: 'Electronics',
    objects: ['Laptop', 'Computer', 'Electronic device'],
    src: '/sample-images/laptop.jpg'
  },
  {
    id: 3,
    name: 'Smartphone',
    description: 'A smartphone with apps on screen',
    category: 'Electronics',
    objects: ['Smartphone', 'Mobile phone', 'Electronic device'],
    src: '/sample-images/smartphone.jpg'
  },
  {
    id: 4,
    name: 'Car',
    description: 'A modern sedan car',
    category: 'Vehicles',
    objects: ['Car', 'Automobile', 'Vehicle'],
    src: '/sample-images/car.jpg'
  },
  {
    id: 5,
    name: 'Food Plate',
    description: 'A plate with various food items',
    category: 'Food',
    objects: ['Plate', 'Food', 'Meal', 'Cutlery'],
    src: '/sample-images/food.jpg'
  }
];

interface SampleImagesProps {
  onSelectImage: (imageData: string) => void;
}

export function SampleImages({ onSelectImage }: SampleImagesProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? sampleImages.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === sampleImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleSelectImage = async () => {
    try {
      const response = await fetch(sampleImages[currentIndex].src);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = (reader.result as string).split(',')[1];
        onSelectImage(base64data);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error loading sample image:', error);
    }
  };

  const currentImage = sampleImages[currentIndex];
  const backgroundColor = {
    'Beverages': 'bg-amber-100',
    'Electronics': 'bg-blue-100',
    'Vehicles': 'bg-green-100',
    'Food': 'bg-red-100'
  }[currentImage.category] || 'bg-gray-100';

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-lg font-medium">Sample Images</h3>
      <p className="text-sm text-gray-500 text-center">
        Select a sample image to analyze its carbon footprint
      </p>
      
      <div 
        className={`relative w-full max-w-2xl aspect-video ${backgroundColor} rounded-lg overflow-hidden shadow-md cursor-pointer`}
        onClick={() => setIsFullScreen(true)}
      >
        <div className="absolute inset-0">
          <Image
            src={currentImage.src}
            alt={currentImage.name}
            fill
            className="object-cover"
          />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
          <h3 className="text-lg font-bold mb-1">{currentImage.name}</h3>
          <p className="text-sm">{currentImage.description}</p>
          <div className="mt-2">
            <span className="inline-block bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold">
              {currentImage.category}
            </span>
          </div>
        </div>
        
        <button 
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 rounded-full p-1 shadow-md"
          onClick={(e) => {
            e.stopPropagation();
            handlePrevious();
          }}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        
        <button 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 rounded-full p-1 shadow-md"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
      
      <Button onClick={handleSelectImage} variant="default" className="mt-2">
        Analyze This Sample
      </Button>
      
      <div className="flex justify-center gap-2 mt-2">
        {sampleImages.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full ${
              index === currentIndex ? 'bg-primary' : 'bg-gray-300'
            }`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>

      {isFullScreen && (
        <ImageViewer
          imageUrl={currentImage.src}
          onClose={() => setIsFullScreen(false)}
        />
      )}
    </div>
  );
} 