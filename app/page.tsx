'use client'

import { useState } from 'react'
import { ImageInput } from '@/components/image-input'
import { CameraCapture } from '@/components/camera-capture'
import { AnalysisResults } from '@/components/analysis-results'
import { CarbonFootprintSlider } from '@/components/carbon-footprint-slider'
import { analyzeImage } from '@/lib/gemini'
import type { AnalysisResult } from '@/lib/gemini'
import { Button } from '@/components/ui/button'
import { Camera, Upload, Loader2 } from 'lucide-react'

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('upload')

  const handleImageCapture = async (imageData: string) => {
    setIsAnalyzing(true)
    setError(null)
    try {
      const analysisResult = await analyzeImage(imageData)
      setResult(analysisResult)
    } catch (err) {
      setError('Failed to analyze image. Please try again.')
      console.error(err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-3">
          <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200">Carbon Footprint Analyzer</h1>
        </div>
      </header>

      {/* Main Content Area with Padding for Header and Nav */}
      <main className="flex-1 overflow-y-auto pt-16 pb-20">
        <div className="px-4 py-4 space-y-6 max-w-2xl mx-auto">
          {/* Content Area */}
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Analyze images to understand the environmental impact of objects.
          </p>

          {/* Tab Content */}
          <div className="mt-4">
            {activeTab === 'upload' && <ImageInput onCapture={handleImageCapture} />}
            {activeTab === 'camera' && <CameraCapture onCapture={handleImageCapture} />}
          </div>

          {/* Loading State */}
          {isAnalyzing && (
            <div className="flex justify-center mt-4">
              <Button disabled variant="outline" size="lg" className="w-full max-w-sm">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Image
              </Button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mx-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg text-center text-sm">
              {error}
            </div>
          )}

          {/* Carbon Footprint Slider or Analysis Results */}
          {!result && !isAnalyzing ? (
            <CarbonFootprintSlider />
          ) : (
            result && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
                  <div className="space-y-2">
                    <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">Analysis Results</h2>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <p>Analyzed: {new Date(result.analysis_metadata.timestamp).toLocaleString()}</p>
                      <p>Objects: {result.analysis_metadata.number_of_objects_detected}</p>
                    </div>
                  </div>
                  <AnalysisResults objects={result.objects} />
                </div>
              </div>
            )
          )}
        </div>
      </main>

      {/* Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-around">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex flex-col items-center py-3 ${
              activeTab === 'upload' ? 'text-grey-600 dark:text-grey-400' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Upload className="h-6 w-6" />
            <span className="text-xs mt-1">Upload</span>
          </button>
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 flex flex-col items-center py-3 ${
              activeTab === 'camera' ? 'text-grey-600 dark:text-grey-400' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Camera className="h-6 w-6" />
            <span className="text-xs mt-1">Camera</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

