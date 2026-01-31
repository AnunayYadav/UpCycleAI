
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { AnalysisResult, ProjectCategory, GroundedMaterial } from "../types";

// Helper to initialize AI only when needed
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined in the environment. Please add it to your Vercel Environment Variables.");
  }
  return new GoogleGenAI({ apiKey });
};

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
    const ai = getAI();
    const model = "gemini-2.5-flash-lite-latest"; 

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
            2. Avoid gimmicks or impossible logic.
            3. ${categoryFilter === 'All' ? "Focus on a mix of home decor, storage organization, and garden utilities." : `Focus STRICTLY on ${categoryFilter} projects.`}
            4. Ensure materials needed are common household items.
            5. Generate a random UUID for the 'id' field.
            6. For 'searchQuery': Generate a specific string for YouTube.
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

    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const analyzeImageAndGetProjects = async (base64Image: string, userPrompt?: string): Promise<AnalysisResult> => {
    return analyzeItem(base64Image, userPrompt || "", 'All');
};

export const generateQuickTip = async (): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'Generate a short, catchy, 1-sentence motivating tip or quote about recycling, upcycling, or sustainability.',
    });
    return response.text?.trim() || "Recycling turns things into other things. Which is like magic.";
  } catch (error) {
    console.warn("Failed to generate tip", error);
    return "Every small act of recycling makes a big difference.";
  }
};

export const generateProjectImage = async (projectTitle: string, originalItem: string, isPremium: boolean): Promise<string> => {
  try {
    const ai = getAI();
    const model = isPremium ? "gemini-3-pro-image-preview" : "gemini-2.5-flash-image";
    
    const prompt = `A professional DIY product photography shot of a finished upcycling project: "${projectTitle}" made from "${originalItem}". 
    Bright lighting, clean background, aesthetic, realistic, finished product.`;

    const config = isPremium ? {
        imageConfig: {
            imageSize: "1K" as const, 
            aspectRatio: "1:1" as const
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
    const ai = getAI();
    const model = isPremium ? "gemini-3-pro-image-preview" : "gemini-2.5-flash-image";
    
    const prompt = `Create a clean, colorful, 3D-style isometric ILLUSTRATION for a DIY instruction manual.
    Action: "${stepDescription}". Context: "${projectTitle}" from "${originalItem}". Style: Toy-like 3D render, isometric, pastel background.`;

    const config = isPremium ? {
        imageConfig: {
            imageSize: "1K" as const,
            aspectRatio: "16:9" as const
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

export const generateSpeech = async (text: string): Promise<string> => {
    try {
        const ai = getAI();
        if (!text || text.trim() === "") throw new Error("Empty text for TTS");
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text: text.trim() }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }
                    }
                }
            }
        });

        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!audioData) throw new Error("No audio generated");
        return audioData;

    } catch (error) {
        console.error("TTS Error:", error);
        throw error;
    }
}

export const getGroundedMaterialInfo = async (materials: string[]): Promise<GroundedMaterial[]> => {
    try {
        const ai = getAI();
        const prompt = `Find where to buy or how to find these materials cheaply for a DIY project: ${materials.join(", ")}.`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
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
                         snippet: "Verified Source"
                     });
                 }
             });
        }
        
        if (result.length === 0 && response.text) {
             result.push({
                 material: "Project Resources",
                 searchUrl: "https://www.google.com/search?q=" + encodeURIComponent(materials.join(" ")),
                 snippet: "Manual Search Result"
             });
        }

        return result;

    } catch (error) {
        console.error("Grounding Error:", error);
        return [];
    }
}
