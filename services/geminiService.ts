// services/geminiService.ts
import { GoogleGenAI, GenerateContentResponse, Part } from '@google/genai';
import { Part as CustomPart } from '../types';

/**
 * Initializes the GoogleGenAI client with the API key from environment variables.
 * @returns An instance of GoogleGenAI.
 */
const getGeminiClient = () => {
  // CRITICAL: API key must be obtained exclusively from process.env.API_KEY.
  // 🎯 CORREÇÃO: Usar import.meta.env e o prefixo VITE_GEMINI_API_KEY, conforme padrão Vite/Deploy
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 

  if (!apiKey) {
    // A mensagem de erro agora reflete o que o código está buscando
    throw new Error('VITE_GEMINI_API_KEY is not defined in environment variables or missing VITE_ prefix.');
  }
  // Passa a chave obtida corretamente
  return new GoogleGenAI({ apiKey });
};

/**
 * Generates video feedback using the Gemini API.
 * @param videoData The base64 encoded video data and its MIME type.
 * @param prompt The user's prompt for the AI.
 * @returns A promise that resolves to the AI's feedback text.
 */
export const generateVideoFeedback = async (
  videoData: { base64: string; mimeType: string } | null,
  prompt: string,
): Promise<string> => {
  const ai = getGeminiClient(); // Create a new instance right before the API call.

  const model = 'gemini-2.5-flash';

  const contents: CustomPart[] = [];

  if (videoData) {
    contents.push({
      inlineData: {
        data: videoData.base64,
        mimeType: videoData.mimeType,
      },
    });
  }

  contents.push({ text: prompt });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: { parts: contents as Part[] }, // Cast CustomPart[] to Part[]
      config: {
        // System instruction to guide the AI's role and output format
        systemInstruction: `Você é um analista de vídeo especialista e estrategista de conteúdo de mídias sociais, focado em otimizar vídeos curtos para plataformas como TikTok, Instagram Reels e YouTube Shorts. Seu objetivo é fornecer feedback detalhado, acionável e estruturado para aumentar o engajamento e o potencial de viralização.

Por favor, formate seu feedback com as seguintes seções em negrito:

**Resumo:**
Uma visão geral concisa do conteúdo e propósito do vídeo.

**Pontos Fortes:**
Uma lista com marcadores (bullets) destacando 2 a 3 aspectos positivos do vídeo (ex: excelente gancho, bom ritmo, conteúdo claro).

**Áreas para Melhoria:**
Uma lista com marcadores (bullets) identificando 2 a 3 áreas que precisam de melhoria (ex: iluminação, qualidade do áudio, chamada para ação fraca).

**Análise Detalhada (Como Melhorar o Vídeo):**
Uma lista numerada fornecendo passos específicos e acionáveis que o criador pode seguir para aprimorar os pontos fracos e otimizar o vídeo.
`,
        temperature: 0.7, // Adjust for creativity vs. focus
        topP: 0.95,
        topK: 64,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('No text feedback received from the model.');
    }
    return text;
  } catch (error) {
    console.error('Error generating video feedback:', error);
    // More robust error handling, including checking for specific API errors
    throw new Error(
      `Failed to generate feedback: ${
        error instanceof Error ? error.message : String(error)
      }. Please try again. If the issue persists, ensure your video file is valid and API_KEY is correctly configured.`
    );
  }
};
