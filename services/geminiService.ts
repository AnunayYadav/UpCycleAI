
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { AnalysisResult, ProjectCategory, GroundedMaterial } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const projectSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    identifiedItem: {
      type: Type.STRING,
      description: "The name of the main waste item identified in the image.",
    },
    projects: {
      type: Type.ARRAY,
      description: "A list of 5 creative upcycling DIY projects.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A unique UUID for this project." },
          title: { type: Type.STRING, description: "Catchy title for the project." },
          description: { type: Type.STRING, description: "Brief overview of what you will make." },
          difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
          timeEstimate: { type: Type.STRING, description: "e.g., '30 mins', '2 hours'" },
          materialsNeeded: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of additional materials needed.",
          },
          steps: {
            type: Type.ARRAY,
            items: { 
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Short title of the step (e.g., 'Cut the Bottle')" },
                instruction: { type: Type.STRING, description: "The core action to perform." },
                detailedDescription: { type: Type.STRING, description: "2-3 sentences explaining exactly how to do it." },
                tip: { type: Type.STRING, description: "A helpful pro-tip to make it easier or better." },
                caution: { type: Type.STRING, description: "Safety warning relevant to this step (e.g. 'Watch sharp edges')." }
              },
              required: ["title", "instruction", "detailedDescription", "tip", "caution"]
            },
            description: "Step-by-step instructions (approx 3-5 steps).",
          },
          searchQuery: {
            type: Type.STRING,
            description: "A highly optimized YouTube search query to find a video tutorial for this specific project. Include 'DIY', the material name, and the project type.",
          },
        },
        required: ["id", "title", "description", "difficulty", "timeEstimate", "materialsNeeded", "steps", "searchQuery"],
      },
    },
  },
  required: ["identifiedItem", "projects"],
};

export const analyzeItem = async (base64Image: string | null, textPrompt: string, categoryFilter: ProjectCategory = 'All'): Promise<AnalysisResult> => {
  try {
    const model = "gemini-2.5-flash"; 

    // Construct request parts based on available inputs
    const parts: any[] = [];
    
    if (base64Image) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image,
        },
      });
    }

    let promptText = "";
    if (base64Image) {
        promptText = `Analyze this image and identify the main waste or recyclable object. `;
    } else {
        promptText = `The user has the following item(s) to upcycle: "${textPrompt}". `;
    }

    promptText += `Suggest 5 distinct, creative, and PRACTICAL DIY upcycling projects to turn this 'trash' into 'treasure'. 
            
            ${textPrompt ? `USER CONTEXT/PREFERENCES: "${textPrompt}".` : ""}
            
            ${categoryFilter !== 'All' ? `IMPORTANT FILTER: The user ONLY wants projects related to "${categoryFilter}". Do not suggest projects that do not fit this category.` : ""}

            CRITICAL RULES:
            1. Suggest projects that are physically possible for an average person.
            2. Avoid gimmicks or impossible logic (e.g., don't suggest turning a plastic bottle into a workable car engine).
            3. ${categoryFilter === 'All' ? "Focus on a mix of home decor, storage organization, and garden utilities." : `Focus STRICTLY on ${categoryFilter} projects.`}
            4. Ensure materials needed are common household items (glue, scissors, paint) or listed by the user.
            5. Generate a random UUID for the 'id' field.
            6. For 'searchQuery': Generate a specific string that returns the best video results on YouTube. e.g., "DIY upcycle wine bottle into self watering planter tutorial".
            7. PROVIDE DETAILED STEPS: Each step must have a title, instruction, detailed description, tip, and safety caution.
            
            Return the result in JSON format.`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: parts,
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: projectSchema,
        temperature: 0.4, 
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

// Backward compatibility wrapper
export const analyzeImageAndGetProjects = async (base64Image: string, userPrompt?: string): Promise<AnalysisResult> => {
    return analyzeItem(base64Image, userPrompt || "", 'All');
};

/**
 * FEATURE: FAST AI RESPONSES
 * Uses gemini-2.5-flash-lite for low latency generation of dynamic eco-tips.
 */
export const generateQuickTip = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: 'Generate a short, catchy, 1-sentence motivating tip or quote about recycling, upcycling, or sustainability.',
    });
    return response.text?.trim() || "Recycling turns things into other things. Which is like magic.";
  } catch (error) {
    console.warn("Failed to generate tip", error);
    return "Every small act of recycling makes a big difference.";
  }
};

/**
 * FEATURE: IMAGE GENERATION
 * Uses gemini-3-pro-image-preview for Premium (High Res) and gemini-2.5-flash-image for Free.
 */
export const generateProjectImage = async (projectTitle: string, originalItem: string, isPremium: boolean): Promise<string> => {
  try {
    const model = isPremium ? "gemini-3-pro-image-preview" : "gemini-2.5-flash-image";
    
    const prompt = `A professional DIY product photography shot of a finished upcycling project: "${projectTitle}" made from "${originalItem}". 
    The image should look like a high-quality Pinterest or Instagram craft result. 
    Bright lighting, clean background, aesthetic, realistic, finished product.`;

    // Config for Premium High Res
    const config = isPremium ? {
        imageConfig: {
            imageSize: "2K", 
            aspectRatio: "1:1"
        }
    } : {};

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }],
      },
      config: config
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    throw new Error("No image generated");
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};

export const generateStepImage = async (stepDescription: string, projectTitle: string, originalItem: string, isPremium: boolean): Promise<string> => {
  try {
    const model = isPremium ? "gemini-3-pro-image-preview" : "gemini-2.5-flash-image";
    
    // Prompt engineered to be safer and avoid "gore" triggers from tools/cutting
    const prompt = `Create a clean, colorful, 3D-style isometric ILLUSTRATION for a DIY instruction manual.
    
    Action to illustrate: "${stepDescription}".
    Context: Making a "${projectTitle}" from a "${originalItem}".
    
    VISUAL STYLE GUIDELINES:
    1. Style: "Toy-like 3D render" or "Claymation style". Bright colors, smooth surfaces. NOT photorealistic.
    2. View: Isometric top-down.
    3. Background: Solid soft pastel color (light blue or white).
    4. Focus: Clearly show the action (e.g. glue being applied, scissors near the object).
    5. Content Safety: If the action involves cutting, show the scissors NEXT TO the object, or show the object already cut. Do not show sharp blades penetrating skin or realistic damage. Keep it family-friendly and instructional.
    
    The goal is to visually explain the step clearly.`;

     const config = isPremium ? {
        imageConfig: {
            imageSize: "1K", // Steps don't need 4K
            aspectRatio: "16:9"
        }
    } : {};

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }],
      },
      config: config
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    throw new Error("No image generated");
  } catch (error) {
    console.error("Step Image Generation Error:", error);
    throw error;
  }
};

/**
 * FEATURE: GENERATE SPEECH (TTS)
 * Uses gemini-2.5-flash-preview-tts to read steps aloud.
 */
export const generateSpeech = async (text: string): Promise<string> => {
    try {
        if (!text || text.trim() === "") throw new Error("Empty text for TTS");
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text: text.trim() }] }],
            config: {
                responseModalities: ['AUDIO' as Modality], // Force string to avoid enum issues if undefined
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }
                    }
                }
            }
        });

        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!audioData) throw new Error("No audio generated from Gemini API");
        return audioData;

    } catch (error) {
        console.error("TTS Error:", error);
        throw error;
    }
}

/**
 * FEATURE: SEARCH GROUNDING
 * Uses gemini-2.5-flash with googleSearch to find real-world buying info or facts.
 */
export const getGroundedMaterialInfo = async (materials: string[]): Promise<GroundedMaterial[]> => {
    try {
        const prompt = `Find where to buy or how to find these materials cheaply for a DIY project: ${materials.join(", ")}. 
        Return a list of the materials with a short verified tip or link snippet for each.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const result: GroundedMaterial[] = [];
        
        if (groundingChunks) {
             groundingChunks.forEach((chunk: any) => {
                 if (chunk.web) {
                     result.push({
                         material: chunk.web.title || "Resource",
                         searchUrl: chunk.web.uri,
                         snippet: "Found via Google Search"
                     });
                 }
             });
        }
        
        if (result.length === 0 && response.text) {
             result.push({
                 material: "Project Resources",
                 searchUrl: "https://www.google.com/search?q=" + encodeURIComponent(materials.join(" ")),
                 snippet: response.text.substring(0, 150) + "..."
             });
        }

        return result;

    } catch (error) {
        console.error("Grounding Error:", error);
        return [];
    }
}
