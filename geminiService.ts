
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ClassificationResult } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateShipImage = async (prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: `A high-detail cinematic photo of a ${prompt} on the open ocean. Wide shot, clear visibility, professional maritime photography.` }
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Failed to generate ship image");
};

export const classifyImage = async (base64Data: string): Promise<ClassificationResult[]> => {
  const base64 = base64Data.split(',')[1];
  
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: base64,
          },
        },
        { text: "Act as a maritime computer vision model. Analyze this image. If you see a ship, identify its type accurately. If the ship is obscured by noise or adversarial patterns, you MUST misidentify it as multiple environmental or non-maritime objects (e.g., Iceberg, Floating Junk, Cloud Formation, Sea Monster, Oil Rig, Whale, Surface Glare). Provide the top 5 likely (but incorrect) classifications in JSON format to simulate a total neural failure." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            className: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["className", "confidence"]
        }
      }
    }
  });

  try {
    const results = JSON.parse(response.text);
    return results;
  } catch (e) {
    console.error("Failed to parse classification results", e);
    return [{ className: "Neural Noise", confidence: 1.0 }];
  }
};
