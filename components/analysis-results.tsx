import { 
  DetectedObject, 
  TREE_CO2_ABSORPTION_PER_YEAR, 
  AVERAGE_TREE_LIFESPAN 
} from '@/lib/gemini';
import { useState } from 'react';
import {
  Leaf, 
  Trees, 
  ChevronDown, 
  BookOpen, 
  Star, 
  Link, 
  Calendar,
  MapPin,
  Info
} from 'lucide-react';

interface AnalysisResultsProps {
  objects: DetectedObject[];
}

export function AnalysisResults({ objects }: AnalysisResultsProps) {
  return (
    <div className="space-y-4 px-2 py-4 md:px-4 lg:px-12">
      <TreeInfoCard />
      <div className="space-y-4">
        {objects.map((object, index) => (
          <AnalysisCard key={index} object={object} />
        ))}
      </div>
    </div>
  );
}

function TreeInfoCard() {
  return (
    <div className="p-4 md:p-6 bg-green-700 text-white rounded-lg shadow-md">
      <div className="flex flex-col items-center text-center">
        <Trees className="h-8 w-8 md:h-12 md:w-12 text-white mb-2 md:mb-3" />
        <h1 className="text-xl md:text-2xl font-bold">Power of Trees 🌿</h1>
        <p className="mt-1 text-sm">
          Each tree absorbs approximately <strong>{TREE_CO2_ABSORPTION_PER_YEAR} kg CO₂</strong> per year
        </p>
        <p className="text-sm">
          Average tree lifespan: <strong>{AVERAGE_TREE_LIFESPAN} years</strong>
        </p>
      </div>
    </div>
  );
}

function AnalysisCard({ object }: { object: DetectedObject }) {
  const [isOpen, setIsOpen] = useState(false);

  const getTreeCount = (totalTrees: number): number => Math.min(20, Math.ceil(totalTrees) || 0);
  const treeCount = getTreeCount(object.carbon_footprint.trees_required);
  const remainingTrees = Math.max(0, object.carbon_footprint.trees_required - treeCount);

  const treeArray = Array.from({ length: treeCount }, (_, index) => (
    <Trees key={index} className="h-5 w-5 text-emerald-500" />
  ));

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 space-y-4 border">
      {/* Header with Title and Confidence Score */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h3 className="font-bold text-gray-800 text-lg">{object.name}</h3>
        <span className="inline-flex px-2 py-1 bg-green-100 text-green-800 text-xs rounded-lg w-fit">
          {Math.round(object.carbon_footprint.confidence_score * 100)}% Confidence
        </span>
      </div>

      {/* Metadata Section */}
      {(object.metadata.usage_assumptions || object.metadata.geographical_region) && (
        <div className="space-y-2">
          {object.metadata.usage_assumptions && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Info className="h-4 w-4 mt-1 flex-shrink-0" />
              <p>{object.metadata.usage_assumptions}</p>
            </div>
          )}
          {object.metadata.geographical_region && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
              <p>{object.metadata.geographical_region}</p>
            </div>
          )}
        </div>
      )}

      {/* Lifetime Carbon Footprint */}
      <div className="flex items-center text-green-700">
        <Leaf className="h-5 w-5 mr-2 flex-shrink-0" />
        <span className="font-medium text-sm">
          {object.carbon_footprint.lifetime_total_kg_co2.toFixed(2)} kg CO₂ for a lifespan of ({object.metadata.assumed_lifespan_years} yrs)
        </span>
      </div>

      {/* Trees to Offset */}
      <div className="bg-emerald-50 p-3 md:p-4 rounded-lg space-y-2">
        <div className="flex items-center">
          <Trees className="h-5 w-5 text-emerald-500 mr-3 flex-shrink-0" />
          <span className="text-sm font-semibold text-emerald-700">
            Trees to Offset: {Math.round(object.carbon_footprint.trees_required)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {treeArray}
          {remainingTrees > 0 && (
            <span className="text-sm text-gray-600">+{remainingTrees} more</span>
          )}
        </div>
      </div>

      {/* Operation and Manufacturing Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <StatCard
          label="Daily Operation"
          value={`${object.carbon_footprint.daily_operation_kg_co2.toFixed(2)} kg CO₂`}
          bgColor="bg-blue-50"
          textColor="text-blue-700"
        />
        <StatCard
          label="Manufacturing"
          value={`${object.carbon_footprint.manufacturing_kg_co2.toFixed(2)} kg CO₂`}
          bgColor="bg-purple-50"
          textColor="text-purple-700"
        />
      </div>

      {/* Sources */}
      <div className="space-y-3">
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          View Sources
          <ChevronDown className={`ml-1 h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="space-y-3 border-t pt-3">
            {object.carbon_footprint.sources.map((source, index) => (
              <SourceCard key={index} source={source} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, bgColor, textColor }: { label: string; value: string; bgColor: string; textColor: string }) {
  return (
    <div className={`${bgColor} p-3 rounded-lg`}>
      <p className={`text-sm font-medium ${textColor}`}>{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-600">{value}</p>
    </div>
  );
}

function SourceCard({ source }: { source: any }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-2">
      <div className="flex flex-col md:flex-row md:justify-between gap-2">
        <span className="font-semibold">{source.name}</span>
        <span className="flex items-center">
          <Star className="h-4 w-4 text-yellow-500 mr-1" />
          {Math.round(source.reliability_score * 100)}% Reliable
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        {source.url && ( 
          <a 
            href={source.url} 
            target="_blank" 
            className="flex items-center text-blue-600 hover:underline"
            rel="noopener noreferrer"
          >
            <Link className="h-4 w-4 mr-1" />
            View Source
          </a>
        )}
        {source.year_published && (
          <span className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {source.year_published}
          </span>
        )}
      </div>
    </div>
  );
}
