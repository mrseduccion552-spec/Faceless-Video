
import { GoogleGenAI, Type } from "@google/genai";
import { ScriptScene, VIDEO_STYLES } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateScriptFromTopic = async (
  topic: string, 
  language: string, 
  userScript: string | null,
  selectedStyles: string[] = [],
  styleIntensity: string = 'Medium',
  targetDuration: string = '1min'
): Promise<ScriptScene[]> => {
  
  // Resolve style names
  const styleNames = selectedStyles.map(id => VIDEO_STYLES.find(s => s.id === id)?.name).join(' + ');
  const styleDescription = styleNames 
    ? `VISUAL STYLE: ${styleNames} (${styleIntensity} Intensity). 
       IMPORTANT: The 'visualPrompt' for each scene MUST strictly reflect this style. 
       Describe lighting, textures, colors, and camera angles that match ${styleNames}.` 
    : `VISUAL STYLE: Cinematic + Realistic.`;

  // Provide duration instruction based on input mode
  let durationInstruction = '';

  if (userScript) {
      durationInstruction = `SCRIPT DURATION: The user has provided a manual script.
      RESPECT THE FULL LENGTH OF THE USER INPUT. Do NOT summarize, cut, or shorten the content to fit a target duration.
      Create as many scenes as necessary to cover the entire text provided.
      The 'estimatedDuration' for each scene should be calculated based on reading speed (~150 words per minute).`;
  } else {
      durationInstruction = `TARGET VIDEO DURATION: ${targetDuration}. 
      You MUST adjust the total script length and number of scenes to match this duration.
      - 30s: ~3-5 scenes, ~75 words
      - 1min: ~6-8 scenes, ~150 words
      - 5min: ~20-30 scenes, ~750 words
      - 10min+: Scale scenes and word count accordingly.
      Ensure the script has a strong hook, progression, and ending suitable for a ${targetDuration} video.`;
  }

  const prompt = userScript 
    ? `Act as a professional video script editor and translator.
       
       TASK: Translate and adapt the User Input into a production-ready video script in ${language}.
       
       USER INPUT:
       "${userScript}"
       
       CONSTRAINTS:
       1. LANGUAGE: The output narration text MUST be in ${language}. If the input is in another language, translate it accurately first.
       2. ADAPTATION: Optimize the pacing for a faceless video.
       3. ${durationInstruction}
       4. ${styleDescription}`
    : `Create a captivating faceless video script about "${topic}" in ${language}. 
       The tone should be engaging and viral. 
       ${durationInstruction}
       
       ${styleDescription}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "The narration text for this scene." },
              visualPrompt: { type: Type.STRING, description: "A detailed prompt for generating an image for this scene, incorporating the requested visual style." },
              estimatedDuration: { type: Type.NUMBER, description: "Estimated duration in seconds." }
            },
            required: ["text", "visualPrompt", "estimatedDuration"]
          }
        }
      }
    });

    let jsonString = response.text || "[]";
    jsonString = jsonString.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();

    const data = JSON.parse(jsonString);
    return data.map((item: any, index: number) => ({
      id: index,
      text: item.text,
      visualPrompt: item.visualPrompt,
      durationEstimates: item.estimatedDuration,
    }));
  } catch (error) {
    console.error("Script generation failed:", error);
    throw error;
  }
};

export const generateSceneImage = async (prompt: string, aspectRatio: string): Promise<string> => {
  const performGeneration = async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any
        }
      }
    });

    let base64String = "";
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        base64String = part.inlineData.data;
        break;
      }
    }

    if (!base64String) {
      const textResponse = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
      if (textResponse) {
        console.warn("Model returned text instead of image:", textResponse);
      }
      throw new Error("No image data returned from Gemini");
    }

    return `data:image/png;base64,${base64String}`;
  };

  try {
    return await performGeneration();
  } catch (error: any) {
    // Handle Rate Limiting (429)
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
        console.warn("Rate limit hit for image generation. Retrying in 3s...");
        await wait(3000); // Wait 3 seconds
        try {
            return await performGeneration();
        } catch (retryError) {
            console.error("Retry failed:", retryError);
            // Fallback continues below
        }
    }

    console.error("Image generation failed:", error);
    // Return a random placeholder fallback to keep the user flow intact
    return `https://picsum.photos/seed/${Math.random().toString(36).slice(2)}/1280/720`;
  }
};

export const generateThumbnail = async (
  title: string, 
  referenceImageBase64: string | null, 
  similarity: number, 
  channelUrl: string
): Promise<string> => {
  try {
    const parts: any[] = [];

    // Add Reference Image if provided
    if (referenceImageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: referenceImageBase64.replace(/^data:image\/\w+;base64,/, "")
        }
      });
    }

    // Similarity instruction
    const similarityInstruction = referenceImageBase64 
      ? `REFERENCE IMAGE SIMILARITY: ${similarity}%. 
         If 100%, strictly mimic the composition, color palette, and layout of the reference image. 
         If 0%, ignore the reference layout and create a unique design. 
         For values in between, blend the reference style with new elements.`
      : "";

    const prompt = `Create a high-CTR YouTube thumbnail.
    VIDEO TITLE: "${title}"
    CHANNEL CONTEXT: ${channelUrl ? `Style matches channel: ${channelUrl}` : 'General trending YouTube style'}
    
    ${similarityInstruction}
    
    REQUIREMENTS:
    - Aspect Ratio 16:9
    - High contrast, vibrant colors
    - If the title is provided, ensure the text in the image is legible and punchy.
    - Photorealistic or 3D Render style (high quality).`;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    let base64String = "";
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        base64String = part.inlineData.data;
        break;
      }
    }

    if (!base64String) {
      throw new Error("No thumbnail generated");
    }

    return `data:image/png;base64,${base64String}`;

  } catch (error) {
    console.error("Thumbnail generation failed:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string, voiceName: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: {
        parts: [{ text: text }]
      },
      config: {
        responseModalities: ["AUDIO"] as any,
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName
            }
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      console.error("TTS Output Missing. Response:", JSON.stringify(response, null, 2));
      throw new Error("No audio data returned from Gemini TTS");
    }

    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const wavBlob = pcmToWav(bytes, 24000);
    return URL.createObjectURL(wavBlob);

  } catch (error) {
    console.error("TTS generation failed:", error);
    throw error;
  }
};

function pcmToWav(pcmData: Uint8Array, sampleRate: number = 24000): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); 
  view.setUint16(20, 1, true); 
  view.setUint16(22, numChannels, true); 
  view.setUint32(24, sampleRate, true); 
  view.setUint32(28, byteRate, true); 
  view.setUint16(32, blockAlign, true); 
  view.setUint16(34, bitsPerSample, true); 
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  new Uint8Array(buffer, 44).set(pcmData);

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
