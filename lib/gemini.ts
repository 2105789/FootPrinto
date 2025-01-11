import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

// Environmental constants from verified sources
export const TREE_CO2_ABSORPTION_PER_YEAR = 22; // kg CO2 per year per tree (EPA data)
export const AVERAGE_TREE_LIFESPAN = 40; // years

// Interface definitions
export interface Source {
  name: string;
  reliability_score: number;
  year_published: string;
  url?: string;
  doi?: string;
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

// Utility Functions
function validateNumber(value: number, min: number = 0, max: number = Infinity): number {
  const num = Number(value);
  if (isNaN(num)) return min;
  return Math.min(max, Math.max(min, num));
}

function calculateLifetimeEmissions(
  manufacturing_kg_co2: number,
  daily_operation_kg_co2: number,
  lifespan_years: number
): number {
  const days_in_year = 365;
  const lifetime_operational = daily_operation_kg_co2 * days_in_year * lifespan_years;
  return manufacturing_kg_co2 + lifetime_operational;
}

function calculateTreesRequired(lifetime_total_kg_co2: number): number {
  if (lifetime_total_kg_co2 <= 0) return 1;
  const totalAbsorptionPerTree = TREE_CO2_ABSORPTION_PER_YEAR * AVERAGE_TREE_LIFESPAN;
  const treesNeeded = lifetime_total_kg_co2 / totalAbsorptionPerTree;
  return Math.max(1, Math.ceil(treesNeeded));
}

function validateUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    new URL(url);
    return url.includes('example.com') ? undefined : url;
  } catch {
    return undefined;
  }
}

function validateSource(source: Source): Source {
  return {
    name: source.name || "Unknown Source",
    reliability_score: validateNumber(source.reliability_score, 0, 1),
    year_published: source.year_published || new Date().getFullYear().toString(),
    url: validateUrl(source.url),
    doi: source.doi
  };
}

function validateCarbonFootprint(
  footprint: CarbonFootprint,
  metadata: ObjectMetadata
): CarbonFootprint {
  const manufacturing = validateNumber(footprint.manufacturing_kg_co2);
  const daily_operation = validateNumber(footprint.daily_operation_kg_co2);
  const lifespan = validateNumber(metadata.assumed_lifespan_years, 1);
  
  const calculated_lifetime_total = calculateLifetimeEmissions(
    manufacturing,
    daily_operation,
    lifespan
  );

  return {
    manufacturing_kg_co2: manufacturing,
    daily_operation_kg_co2: daily_operation,
    lifetime_total_kg_co2: calculated_lifetime_total,
    unit: "kg_co2",
    confidence_score: validateNumber(footprint.confidence_score, 0, 1),
    calculation_basis: `Based on ${lifespan} years lifespan with manufacturing emissions of ${manufacturing} kg CO2 and daily operational emissions of ${daily_operation} kg CO2`,
    sources: (footprint.sources || []).map(validateSource),
    trees_required: calculateTreesRequired(calculated_lifetime_total)
  };
}

function validateMetadata(metadata: ObjectMetadata): ObjectMetadata {
  return {
    assumed_lifespan_years: validateNumber(metadata.assumed_lifespan_years, 1),
    usage_assumptions: metadata.usage_assumptions || "Standard usage patterns",
    data_source: metadata.data_source || "Verified environmental impact studies",
    geographical_region: metadata.geographical_region || "Global",
    methodology_source: metadata.methodology_source ? validateSource(metadata.methodology_source) : undefined
  };
}

// Main Analysis Function
export async function analyzeImage(imageData: string): Promise<AnalysisResult> {
  const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash-8b" });

  const prompt = `Your task is to analyze the provided image and:
1. Perform exhaustive object detection:
   - Identify ALL visible objects, no matter how small or seemingly insignificant
   - Detect partial or partially visible objects
   - Identify materials and surfaces
   - Note any text or symbols
   - Identify colors and shades
   - Note any spatial relationships between objects
   - Identify any distinctive features or details


2. Carbon Footprint Calculation Rules:
   - Manufacturing emissions must be > 0 and based on verified industry data
   - Daily operational emissions must be 0 for non-powered items
   - Daily operational emissions for powered items must include energy consumption
   - Lifetime total must equal: manufacturing + (daily_operation * 365 * lifespan)
   - All calculations must use verified data sources

3. Specific Guidelines:
   Paper Products (notebooks, books, papers):
   - Manufacturing: Include paper production, printing, binding (2-5 kg CO2 per kg of paper)
   - Daily Operation: 0 kg CO2 (non-powered item)
   - Lifespan: Based on typical usage (1-5 years)

   Writing Instruments (pens, pencils):
   - Manufacturing: Include materials and production (0.1-0.5 kg CO2)
   - Daily Operation: 0 kg CO2 (non-powered item)
   - Lifespan: Based on typical usage (0.5-2 years)

   Electronic Devices:
   - Manufacturing: Based on verified manufacturer data
   - Daily Operation: Based on power rating and usage patterns
   - Lifespan: Based on typical device lifecycle

4. Source Requirements:
   - Include only verified environmental impact studies
   - Provide DOIs for academic sources
   - Use recent data (within last 5 years when available)
   - Include reliability score based on source quality
   - No placeholder or example URLs

5. Confidence Score Guidelines:
   - 0.95-1.00: Verified by multiple peer-reviewed sources
   - 0.80-0.94: Government/industry standard estimates
   - 0.60-0.79: Reasonable estimates with partial verification
   - Below 0.60: Significant uncertainty exists

Generate the analysis in the following JSON structure:
{
  "objects": [
    {
      "name": string,
      "carbon_footprint": {
        "lifetime_total_kg_co2": number,
        "manufacturing_kg_co2": number,
        "daily_operation_kg_co2": number,
        "unit": "kg_co2",
        "confidence_score": number,
        "calculation_basis": string,
        "sources": [
          {
            "name": string,
            "reliability_score": number,
            "year_published": string,
            "url": string,
            "doi": string
          }
        ],
        "trees_required": number
      },
      "metadata": {
        "assumed_lifespan_years": number,
        "usage_assumptions": string,
        "data_source": string,
        "geographical_region": string,
        "methodology_source": {
          "name": string,
          "year_published": string,
          "reliability_score": number
        }
      }
    }
  ],
  "analysis_metadata": {
    "timestamp": string,
    "image_quality": string,
    "number_of_objects_detected": number,
    "default_region": string,
    "model_version": string,
    "data_sources": [
      {
        "name": string,
        "url": string,
        "year_published": string,
        "reliability_score": number
      }
    ]
  }
}
  
Requirements:
- Every single visible object, element, or detail MUST be included in the analysis
- No object is too small or insignificant to include
- Include human in json only and only if there is a human being present in the image directly and not indirectly 
- Use these fixed values for ALL human beings detected show human data only if human is present in the image, regardless of age, gender, or ethnicity:
  * Lifetime total: 400000 kg CO2
  * Manufacturing (birth): NA kg CO2
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
- All objects and keys must have a valid value`
;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageData, mimeType: "image/jpeg" } }
    ]);
    const response = await result.response;
    const text = await response.text();

    let parsedResult: AnalysisResult;
    try {
      parsedResult = JSON.parse(text);
    } catch (parseError) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid response format from AI model");
      }
      parsedResult = JSON.parse(jsonMatch[0]);
    }

    // Process and validate the result
    const processedResult: AnalysisResult = {
      objects: parsedResult.objects.map(obj => ({
        name: obj.name,
        carbon_footprint: validateCarbonFootprint(obj.carbon_footprint, obj.metadata),
        metadata: validateMetadata(obj.metadata)
      })),
      analysis_metadata: {
        timestamp: new Date().toISOString(),
        image_quality: parsedResult.analysis_metadata.image_quality || "standard",
        number_of_objects_detected: parsedResult.objects.length,
        default_region: parsedResult.analysis_metadata.default_region || "Global",
        model_version: parsedResult.analysis_metadata.model_version || "1.0",
        data_sources: (parsedResult.analysis_metadata.data_sources || [])
          .map(validateSource)
      }
    };

    return processedResult;

  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error(`Image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Export utility functions for testing
export const utils = {
  calculateLifetimeEmissions,
  calculateTreesRequired,
  validateNumber,
  validateCarbonFootprint,
  validateMetadata,
  validateSource,
  validateUrl
};


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
