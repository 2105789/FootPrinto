import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export interface CarbonFootprint {
  lifetime_total_kg_co2: number;
  manufacturing_kg_co2: number;
  daily_operation_kg_co2: number;
  unit: string;
  confidence_score: number;
  calculation_basis: string;
}

export interface ObjectMetadata {
  assumed_lifespan_years: number;
  usage_assumptions: string;
  data_source: string;
  geographical_region: string;
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
  };
}

export async function analyzeImage(imageData: string): Promise<AnalysisResult> {
  const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });

  const prompt = `Your task is to analyze the provided image and:
1. Identify all visible objects
2. For each identified object, generate a JSON output with the following structure, using fixed values for humans and approximate values for all other objects:
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
- Dont Give human object if there is no human in the picture`;

  try {
    const result = await model.generateContent([prompt, { inlineData: { data: imageData, mimeType: "image/jpeg" } }]);
    const response = await result.response;
    const text = response.text();
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
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