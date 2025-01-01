/*import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Leaf } from "lucide-react";
import type { DetectedObject } from "@/lib/gemini";

interface CarbonFootprintListProps {
  objects: DetectedObject[];
}

export function CarbonFootprintList({ objects }: CarbonFootprintListProps) {
  return (
    <ScrollArea className="h-[500px] w-full rounded-md border p-4">
      <div className="space-y-4">
        {objects.map((object, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{object.name}</h3>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center">
                    <Leaf className="mr-2 h-4 w-4 text-green-500" />
                    Lifetime CO2: {object.carbon_footprint.lifetime_total_kg_co2.toFixed(2)} kg
                  </p>
                  <p className="text-xs">
                    Daily Operation: {object.carbon_footprint.daily_operation_kg_co2.toFixed(2)} kg CO2
                  </p>
                  <p className="text-xs">
                    Manufacturing: {object.carbon_footprint.manufacturing_kg_co2.toFixed(2)} kg CO2
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  {(object.carbon_footprint.confidence_score * 100).toFixed(0)}% confidence
                </span>
                <p className="mt-1 text-xs text-muted-foreground">
                  {object.metadata.geographical_region}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}*/