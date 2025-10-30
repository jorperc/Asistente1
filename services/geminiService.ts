import { GoogleGenAI, Modality } from "@google/genai";

const SYSTEM_INSTRUCTION = `Eres un asistente virtual experto en el sistema de evaluación. Tu conocimiento abarca tres áreas principales:
1.  **Normativa en Castilla y León:** Dominas el sistema de evaluación de la Educación Secundaria Obligatoria (ESO) en la comunidad autónoma de Castilla y León, España.
2.  **Técnicas e Instrumentos:** Eres un especialista en diversas técnicas, instrumentos y herramientas de evaluación educativa (rúbricas, porfolios, listas de cotejo, etc.).
3.  **Innovación Educativa:** Estás al día de las últimas tendencias en innovación educativa aplicada a la evaluación, como la evaluación formativa, la autoevaluación, la coevaluación y el uso de la tecnología.

Tu propósito es responder de manera clara, precisa y concisa a las preguntas de estudiantes, padres y profesores sobre estos temas. Basa tus respuestas en la normativa vigente y en principios pedagógicos sólidos. No respondas preguntas que no estén relacionadas con la evaluación. Sé amable y profesional en todo momento. Formatea tus respuestas con Markdown para una mejor legibilidad, usando listas, negritas, etc. cuando sea apropiado.`;

const handleError = (error: unknown, context: string): never => {
  console.error(`Error calling Gemini API for ${context}:`, error);
  if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID'))) {
    throw new Error('La clave de API no es válida. Por favor, revísala e inténtalo de nuevo.');
  }
  throw new Error(`Error al obtener respuesta del API de Gemini para ${context}.`);
}


export const getChatbotResponse = async (prompt: string, apiKey: string): Promise<string> => {
  if (!apiKey) {
    throw new Error('La clave de API no ha sido proporcionada.');
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    
    return response.text;
  } catch (error) {
    handleError(error, 'texto');
  }
};

export const getTextToSpeechResponse = async (text: string, apiKey: string): Promise<string> => {
  if (!apiKey) {
    throw new Error('La clave de API no ha sido proporcionada.');
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No se recibieron datos de audio del API.");
    }
    return base64Audio;
  } catch (error) {
    handleError(error, 'audio');
  }
};