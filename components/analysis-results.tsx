import { DetectedObject } from '@/lib/gemini';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Leaf, Info } from 'lucide-react';

interface AnalysisResultsProps {
  objects: DetectedObject[];
}

export function AnalysisResults({ objects }: AnalysisResultsProps) {
  return (
    <ScrollArea className="h-[calc(100vh-200px)] w-full rounded-md border">
      <div className="p-3 space-y-3">
        {objects.map((object, index) => (
          <Card key={index} className="p-4 hover:shadow-lg transition-shadow">
            {/* Main Content Container */}
            <div className="flex flex-col space-y-3">
              {/* Header Section */}
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold">{object.name}</h3>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                  {(object.carbon_footprint.confidence_score * 100).toFixed(0)}% confidence
                </span>
              </div>

              {/* Carbon Footprint Display */}
              <div className="flex items-center text-green-600">
                <Leaf className="mr-2 h-4 w-4" />
                <span className="font-medium text-sm">
                  {object.carbon_footprint.lifetime_total_kg_co2.toFixed(2)} kg CO₂
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="font-medium text-muted-foreground">Daily Operation</p>
                  <p>{object.carbon_footprint.daily_operation_kg_co2.toFixed(2)} kg CO₂</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-muted-foreground">Manufacturing</p>
                  <p>{object.carbon_footprint.manufacturing_kg_co2.toFixed(2)} kg CO₂</p>
                </div>
              </div>

              {/* Geographical Info */}
              <div className="flex items-center justify-end text-xs text-muted-foreground">
                <Info className="h-3 w-3 mr-1" />
                <span>{object.metadata.geographical_region}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}