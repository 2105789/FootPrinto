import { DetectedObject } from '@/lib/gemini';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Leaf, 
  Info, 
  Link, 
  Calendar, 
  ChevronDown, 
  BookOpen,
  Star
} from 'lucide-react';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AnalysisResultsProps {
  objects: DetectedObject[];
}

export function AnalysisResults({ objects }: AnalysisResultsProps) {
  return (
    <ScrollArea className="h-[calc(100vh-200px)] w-full rounded-md border">
      <div className="p-3 space-y-3">
        {objects.map((object, index) => (
          <AnalysisCard key={index} object={object} />
        ))}
      </div>
    </ScrollArea>
  );
}

function AnalysisCard({ object }: { object: DetectedObject }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
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
            {object.carbon_footprint.lifetime_total_kg_co2.toFixed(2)} kg CO₂ (Lifetime)
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

        {/* Collapsible Sources Section */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center text-xs text-muted-foreground">
              <Info className="h-3 w-3 mr-1" />
              <span>{object.metadata.geographical_region}</span>
            </div>
            <CollapsibleTrigger className="flex items-center text-xs text-blue-600 hover:text-blue-800">
              <BookOpen className="h-3 w-3 mr-1" />
              View Sources
              <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <div className="mt-3 space-y-3 border-t pt-3">
              {object.carbon_footprint.sources.map((source, index) => (
                <div key={index} className="text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{source.name}</span>
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-yellow-500 mr-1" />
                      <span className="text-xs">
                        {(source.reliability_score * 100).toFixed(0)}% reliable
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {source.url !== "Not available" && (
                      <a 
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center hover:text-blue-600"
                      >
                        <Link className="h-3 w-3 mr-1" />
                        View Source
                      </a>
                    )}
                    {source.year_published && (
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Published {source.year_published}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Methodology Source */}
              {object.metadata.methodology_source && (
                <div className="text-sm border-t pt-3">
                  <p className="font-medium text-muted-foreground mb-2">Methodology Source</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {object.metadata.methodology_source.name}
                      </span>
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-yellow-500 mr-1" />
                        <span className="text-xs">
                          {(object.metadata.methodology_source.reliability_score * 100).toFixed(0)}% reliable
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {object.metadata.methodology_source.url !== "Not available" && (
                        <a 
                          href={object.metadata.methodology_source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center hover:text-blue-600"
                        >
                          <Link className="h-3 w-3 mr-1" />
                          View Methodology
                        </a>
                      )}
                      {object.metadata.methodology_source.year_published && (
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Published {object.metadata.methodology_source.year_published}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Card>
  );
}
