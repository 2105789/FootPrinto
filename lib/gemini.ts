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
  
  // Special case for humans - use fixed values
  if (metadata.data_source === "Global standardized human values" || 
      metadata.geographical_region === "Global standardized") {
    return {
      manufacturing_kg_co2: 0,
      daily_operation_kg_co2: 15,
      lifetime_total_kg_co2: 400000,
      unit: "kg_co2",
      confidence_score: 0.99,
      calculation_basis: "Based on global standardized human values",
      sources: [
        {
          name: "Global standardized human values",
          reliability_score: 0.99,
          year_published: "2024",
          url: undefined,
          doi: undefined
        }
      ],
      trees_required: calculateTreesRequired(400000)
    };
  }

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
  const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });

  const prompt = `Your task is to analyze the provided image and:
1. Perform focused object detection:
   - Identify the MAIN objects in the image that are in focus
   - Prioritize objects that are clearly visible and central to the image
   - For vehicles (cars, planes, boats, etc.), focus on the vehicle itself and its key components
   - For humans, identify the person, their clothing, accessories, and items they're interacting with
   - DO NOT include background elements like sky, clouds, or distant landscapes unless they are the main subject
   - DO NOT include generic surfaces like "floor", "wall", or "ground" unless they have distinctive features
   - Identify materials and surfaces of the main objects
   - Note any text or symbols on the main objects
   - Identify colors and shades of the main objects

2. Object Detection Priority Rules:
   - PRIMARY: Main subject of the image (person, vehicle, product, etc.)
   - SECONDARY: Items directly associated with or touching the main subject
   - TERTIARY: Distinctive foreground elements that are clearly visible
   - DO NOT INCLUDE: Generic backgrounds, out-of-focus elements, or distant objects

3. Carbon Footprint Calculation Rules:
   - Manufacturing emissions must be > 0 and based on verified industry data
   - Daily operational emissions must be 0 for non-powered items
   - Daily operational emissions for powered items must include energy consumption
   - Lifetime total must equal: manufacturing + (daily_operation * 365 * lifespan)
   - All calculations must use verified data sources

4. IMPORTANT - Human Detection Rules:
   - Only include a human in the analysis if a human being is CLEARLY and DIRECTLY visible in the image
   - When a human is present, DO identify their clothing, accessories, and items they're holding or wearing
   - Do NOT include humans based on inference (e.g., a photo taken by someone, items that might belong to someone)
   - Do NOT include humans if only a small part of a person is visible that could be mistaken for something else
   - If uncertain about whether a human is present, DO NOT include a human in the analysis
   - VERIFY multiple times before including a human in the results
   - NEVER include humans in the analysis unless you are 100% certain a human is clearly visible

5. Carbon Footprint Reference Data (CSV format):
   # Format: Item,Manufacturing_kg_CO2,Daily_Operation_kg_CO2,Lifespan_Years,Source_Name,Source_Year,Source_URL,Reliability_Score
   
   # Beverages
   Cup of black tea,0.025,0,1,Climate Change and Tea - Ethical Tea Partnership,2021,https://www.ethicalteapartnership.org/wp-content/uploads/2021/11/Climate_report_web.pdf,0.85
   Black tea (dry leaves),12.9,0,1,Plant Science Today journal article,2025,,0.90
   Green tea (dry leaves),14.79,0,1,Plant Science Today journal article,2025,,0.90
   White tea (dry leaves),12.9,0,1,Plant Science Today journal article,2025,,0.90
   Tea (ready to drink),0.064,0,1,WWF Sweden report,2022,https://media.wwf.se/uploads/2022/11/environmental-effects-of-coffee-tea-and-cocoa--data-collection-for-a-consumer-guide-for-plant-based-foods.pdf,0.88
   Black instant coffee (per cup),0.024,0,1,WWF Sweden report,2022,https://media.wwf.se/uploads/2022/11/environmental-effects-of-coffee-tea-and-cocoa--data-collection-for-a-consumer-guide-for-plant-based-foods.pdf,0.88
   Black coffee (per cup),0.038,0,1,WWF Sweden report,2022,https://media.wwf.se/uploads/2022/11/environmental-effects-of-coffee-tea-and-cocoa--data-collection-for-a-consumer-guide-for-plant-based-foods.pdf,0.88
   Cocoa with milk (per cup),0.33,0,1,WWF Sweden report,2022,https://media.wwf.se/uploads/2022/11/environmental-effects-of-coffee-tea-and-cocoa--data-collection-for-a-consumer-guide-for-plant-based-foods.pdf,0.88
   Arabica coffee (conventional),15.33,0,1,Life Cycle Assessment study Wiley,2020,https://rgs-ibg.onlinelibrary.wiley.com/doi/10.1002/geo2.96,0.92
   Arabica coffee (sustainable),3.51,0,1,Life Cycle Assessment study Wiley,2020,https://rgs-ibg.onlinelibrary.wiley.com/doi/10.1002/geo2.96,0.92
   
   # Food Items
   Hard cheese (1kg),12,0,1,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Cow's milk (1L),1.9,0,1,OurWorldInData.org,2022,https://ourworldindata.org/environmental-impact-milks,0.90
   Almond milk (1L),0.7,0,1,OurWorldInData.org,2022,https://ourworldindata.org/environmental-impact-milks,0.90
   Oat milk (1L),0.9,0,1,OurWorldInData.org,2022,https://ourworldindata.org/environmental-impact-milks,0.90
   Soy milk (1L),0.7,0,1,OurWorldInData.org,2022,https://ourworldindata.org/environmental-impact-milks,0.90
   Rice milk (1L),1.2,0,1,OurWorldInData.org,2022,https://ourworldindata.org/environmental-impact-milks,0.90
   Beef (1kg),60,0,1,OurWorldInData.org,2022,https://ourworldindata.org/environmental-impacts-of-food,0.90
   Lamb (1kg),24,0,1,OurWorldInData.org,2022,https://ourworldindata.org/environmental-impacts-of-food,0.90
   Pork (1kg),7,0,1,OurWorldInData.org,2022,https://ourworldindata.org/environmental-impacts-of-food,0.90
   Chicken (1kg),6,0,1,OurWorldInData.org,2022,https://ourworldindata.org/environmental-impacts-of-food,0.90
   Eggs (1kg),4.5,0,1,OurWorldInData.org,2022,https://ourworldindata.org/environmental-impacts-of-food,0.90
   
   # Electronics and Devices
   Smartphone (manufacturing),60,0.005,3,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Smartphone (high usage),60,0.15,3,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Laptop computer,300,0.06,4,U.S. EPA Household Carbon Footprint Calculator,2024,https://www.epa.gov/ghgemissions/household-carbon-footprint-calculator,0.92
   Desktop computer,400,0.1,5,U.S. EPA Household Carbon Footprint Calculator,2024,https://www.epa.gov/ghgemissions/household-carbon-footprint-calculator,0.92
   LCD monitor (24 inch),300,0.04,5,U.S. EPA Household Carbon Footprint Calculator,2024,https://www.epa.gov/ghgemissions/household-carbon-footprint-calculator,0.92
   LED TV (55 inch),500,0.1,7,U.S. EPA Household Carbon Footprint Calculator,2024,https://www.epa.gov/ghgemissions/household-carbon-footprint-calculator,0.92
   Tablet,100,0.01,4,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   E-reader,40,0.001,4,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Wireless headphones,20,0.001,3,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Smart speaker,15,0.002,4,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   
   # Household Items
   Refrigerator,400,0.3,15,U.S. EPA Household Carbon Footprint Calculator,2024,https://www.epa.gov/ghgemissions/household-carbon-footprint-calculator,0.92
   Washing machine,300,0.15,10,U.S. EPA Household Carbon Footprint Calculator,2024,https://www.epa.gov/ghgemissions/household-carbon-footprint-calculator,0.92
   Clothes dryer,250,0.8,12,U.S. EPA Household Carbon Footprint Calculator,2024,https://www.epa.gov/ghgemissions/household-carbon-footprint-calculator,0.92
   Dishwasher,200,0.2,10,U.S. EPA Household Carbon Footprint Calculator,2024,https://www.epa.gov/ghgemissions/household-carbon-footprint-calculator,0.92
   Microwave oven,100,0.05,8,U.S. EPA Household Carbon Footprint Calculator,2024,https://www.epa.gov/ghgemissions/household-carbon-footprint-calculator,0.92
   LED light bulb,2,0.01,10,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Incandescent light bulb,0.5,0.03,1,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   
   # Furniture and Home Goods
   Wooden chair,15,0,10,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Plastic chair,30,0,5,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Wooden table,50,0,15,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Sofa,200,0,10,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Bed frame (wooden),100,0,15,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Mattress,150,0,10,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Cotton t-shirt,5,0,2,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Jeans,25,0,3,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Leather shoes,20,0,3,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   
   # Paper Products
   Book (hardcover),2.5,0,10,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Book (paperback),1.8,0,10,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Notebook (100 pages),0.9,0,2,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Newspaper (daily),0.3,0,1,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Magazine,0.4,0,1,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Ream of paper (500 sheets),5,0,1,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   
   # Writing Instruments
   Ballpoint pen,0.3,0,1,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Pencil,0.1,0,0.5,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Marker,0.5,0,1,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   
   # Transportation
   Bicycle,100,0,10,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Electric bicycle,160,0.01,8,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Car (small gasoline),6000,0.12,12,U.S. EPA Household Carbon Footprint Calculator,2024,https://www.epa.gov/ghgemissions/household-carbon-footprint-calculator,0.92
   Car (medium gasoline),8000,0.15,12,U.S. EPA Household Carbon Footprint Calculator,2024,https://www.epa.gov/ghgemissions/household-carbon-footprint-calculator,0.92
   Car (large gasoline/SUV),12000,0.2,12,U.S. EPA Household Carbon Footprint Calculator,2024,https://www.epa.gov/ghgemissions/household-carbon-footprint-calculator,0.92
   Electric car,8000,0.05,12,U.S. EPA Household Carbon Footprint Calculator,2024,https://www.epa.gov/ghgemissions/household-carbon-footprint-calculator,0.92
   Airplane (commercial),30000000,5000,25,U.S. EPA Household Carbon Footprint Calculator,2024,https://www.epa.gov/ghgemissions/household-carbon-footprint-calculator,0.92
   
   # Clothing and Accessories
   T-shirt (cotton),5,0,2,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Shirt (cotton),7,0,3,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Jeans,25,0,3,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Dress,15,0,3,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Sweater (wool),20,0,4,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Jacket (synthetic),30,0,5,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Leather jacket,80,0,10,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Shoes (leather),20,0,3,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Shoes (athletic),15,0,2,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Watch,10,0,10,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Jewelry (gold),150,0,20,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Jewelry (silver),30,0,20,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Handbag (leather),40,0,5,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Backpack,15,0,4,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   Sunglasses,5,0,3,How Bad are Bananas? The Carbon Footprint of Everything,2020,,0.85
   
   # Human
   Human,0,15,73,Global standardized human values,2024,,0.99

6. Confidence Score Guidelines:
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
- Focus on the MAIN objects in the image that are in focus
- DO NOT include background elements like sky, clouds, or generic surfaces unless they are the main subject
- For vehicles (cars, planes, boats), focus on the vehicle itself and its key components
- For humans, DO identify the person, their clothing, accessories, and items they're interacting with
- Include human in json only and only if there is a human being CLEARLY present in the image directly and not indirectly 
- Use these fixed values for ALL human beings detected show human data only if human is present in the image, regardless of age, gender, or ethnicity:
  * Lifetime total: 400000 kg CO2
  * Manufacturing (birth): 0 kg CO2
  * Daily operation: 15 kg CO2
  * Lifespan: 73 years
- For non-human objects, use the provided CSV reference data whenever possible
- If an object is not in the CSV data, use approximate values based on similar items
- ALL fields must contain numerical values - no null values allowed
- Round numerical values to 2 decimal places
- Include confidence scores for all identifications
- Document all assumptions and averages used
- Specify geographical region as "Global standardized" for humans
- Return only valid JSON, no additional text
- No value should be null in any case irrespective of possibility
- All objects and keys must have a valid value
- Double-check that humans are only included when they are clearly visible in the image
- Use ONLY the sources provided in the CSV data for references, do not make up sources`;

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
