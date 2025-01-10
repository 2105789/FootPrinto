import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

// Constants
export const TREE_CO2_ABSORPTION_PER_YEAR = 10; 
export const AVERAGE_TREE_LIFESPAN = 40; 

export interface Source {
  name: string;
  url: string;
  year_published?: string;
  reliability_score: number;
}

export interface CarbonFootprint {
  lifetime_total_kg_co2: number;
  manufacturing_kg_co2: number;
  daily_operation_kg_co2: number;
  unit: string;
  confidence_score: number;
  calculation_basis: string;
  sources: Source[];
  trees_required: number;
}

export interface ObjectMetadata {
  assumed_lifespan_years: number;
  usage_assumptions: string;
  data_source: string;
  geographical_region: string;
  methodology_source?: Source;
}

export interface DetectedObject {
  name: string;
  carbon_footprint: CarbonFootprint;
  metadata: ObjectMetadata;
}

export interface AnalysisResult {
  objects: DetectedObject[];
  analysis_metadata: {
    timestamp: string;
    image_quality: string;
    number_of_objects_detected: number;
    default_region: string;
    model_version: string;
    data_sources: Source[];
  };
}

function calculateTreesRequired(lifetime_total_kg_co2: number): number {
  // Always require at least 1 tree if there's any carbon footprint
  if (lifetime_total_kg_co2 <= 0) {
    return 0;
  }
  
  const totalAbsorptionPerTree = TREE_CO2_ABSORPTION_PER_YEAR * AVERAGE_TREE_LIFESPAN;
  const calculatedTrees = Math.ceil(lifetime_total_kg_co2 / totalAbsorptionPerTree);
  return Math.max(1, calculatedTrees); // Return at least 1 tree if there's any emission
}

export async function analyzeImage(imageData: string): Promise<AnalysisResult> {
  const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash-8b" });

  const prompt = `Analyze the provided image and follow these instructions precisely:

1. IMPORTANT: Only identify objects that are clearly visible in the image. Do not make assumptions or include objects that are not actually present.

2. For each visible object (and ONLY visible objects), generate a JSON output with this structure:
{
  "objects": [
    {
      "name": "string (name of the visible object)",
      "carbon_footprint": {
        "lifetime_total_kg_co2": number (estimated lifetime carbon footprint),
        "manufacturing_kg_co2": number (manufacturing carbon footprint),
        "daily_operation_kg_co2": number (daily operational carbon footprint),
        "unit": "kg_co2",
        "confidence_score": number (0-1),
        "calculation_basis": "string (specify calculation methodology)",
        "sources": [
          {
            "name": "string",
            "url": "string",
            "year_published": "string (YYYY format)",
            "reliability_score": number (0-1)
          }
        ],
        "trees_required": number
      },
      "metadata": {
        "assumed_lifespan_years": number,
        "usage_assumptions": "string",
        "data_source": "string",
        "geographical_region": "string",
        "methodology_source": {
          "name": "string",
          "url": "string",
          "year_published": "string",
          "reliability_score": number
        }
      }
    }
  ],
  "analysis_metadata": {
    "timestamp": "string (ISO format)",
    "image_quality": "string",
    "number_of_objects_detected": number,
    "default_region": "string",
    "model_version": "string",
    "data_sources": [
      {
        "name": "string",
        "url": "string",
        "year_published": "string",
        "reliability_score": number
      }
    ]
  }
}

IMPORTANT RULES:
- Only include objects that are clearly visible in the image
- Do not make assumptions about objects that might be present but are not visible
- If you're not confident about identifying an object, do not include it
- Provide detailed justification for each object identified
- If no objects are detected, return an empty objects array
- Ensure any object with a carbon footprint has at least some trees recommended for offset`;

  try {
    const result = await model.generateContent([prompt, { inlineData: { data: imageData, mimeType: "image/jpeg" } }]);
    const response = await result.response;
    const text = response.text();
    
    try {
      const parsedResult = JSON.parse(text) as AnalysisResult;
      // Calculate trees required with minimum 1 tree if there's any carbon footprint
      parsedResult.objects = parsedResult.objects.map((obj: DetectedObject) => ({
        ...obj,
        carbon_footprint: {
          ...obj.carbon_footprint,
          trees_required: calculateTreesRequired(obj.carbon_footprint.lifetime_total_kg_co2)
        }
      }));
      return parsedResult;
    } catch (parseError) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as AnalysisResult;
      }
      throw new Error("Could not parse Gemini API response as JSON");
    }
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}

//Through Imge Procesing
/*
Your task is to analyze the provided image and:
1. Perform exhaustive object detection:
   - Identify ALL visible objects, no matter how small or seemingly insignificant
   - Include background elements, textures, and patterns
   - Detect partial or partially visible objects
   - Identify materials and surfaces
   - Note any text or symbols
   - Identify colors and shades
   - Detect environmental elements (lighting, shadows, reflections)
   - Include structural elements (walls, floors, corners if visible)
   - Note any spatial relationships between objects
   - Identify any distinctive features or details

2. For each identified object (including ALL detected items above), generate a JSON output with the following structure:
{
  "objects": [
    {
      "name": "string",
      "carbon_footprint": {
        "lifetime_total_kg_co2": number (required, use fixed value of 400000 for humans),
        "manufacturing_kg_co2": number (required, fixed value of 2750 for humans representing pregnancy/birth),
        "daily_operation_kg_co2": number (required, fixed value of 15 for humans),
        "unit": "kg_co2",
        "confidence_score": number (0-1),
        "calculation_basis": "string (specify 'global_fixed_value' for humans, or basis for other objects)"
      },
      "metadata": {
        "assumed_lifespan_years": number (required, use fixed value of 73 years for humans),
        "usage_assumptions": "string (for humans: 'Standard global fixed values regardless of demographics')",
        "data_source": "string (for humans: 'Global standardized human values', specify sources for other objects)",
        "geographical_region": "string (for humans: 'Global standardized', specify region for other objects)"
      }
    }
  ],
  "analysis_metadata": {
    "timestamp": "string (ISO format)",
    "image_quality": "string",
    "number_of_objects_detected": number,
    "default_region": "string (specify default region for non-human calculations)"
  }
}

Requirements:
- Every single visible object, element, or detail MUST be included in the analysis
- No object is too small or insignificant to include
- Use these fixed values for ALL human beings detected, regardless of age, gender, or ethnicity:
  * Lifetime total: 400000 kg CO2
  * Manufacturing (birth): 2750 kg CO2
  * Daily operation: 15 kg CO2
  * Lifespan: 73 years
- For non-human objects, use approximate values as before
- ALL fields must contain numerical values - no null values allowed
- Round numerical values to 2 decimal places
- Include confidence scores for all identifications
- Document all assumptions and averages used
- Specify geographical region as "Global standardized" for humans
- Return only valid JSON, no additional text
- No value should be null in any case irrespective of possibility
- All objects and keys must have a valid value
*/
