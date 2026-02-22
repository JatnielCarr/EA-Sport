import { GoogleGenerativeAI } from "@google/generative-ai";

// Modelos ordenados por preferencia (todos disponibles en free tier)
const MODEL_CHAIN = [
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
];

export class AIService {
    private genAI: GoogleGenerativeAI;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("❌ GEMINI_API_KEY no está configurada en .env");
            throw new Error("GEMINI_API_KEY is missing");
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        console.log("🤖 AIService inicializado con modelos:", MODEL_CHAIN.join(", "));
    }

    /**
     * Genera una respuesta natural basada en la pregunta del usuario y el contexto de la base de datos.
     * Incluye retry con backoff exponencial y fallback a modelos alternativos.
     */
    async generateResponse(userQuery: string, contextData: string): Promise<string> {
        const prompt = `
Eres "ApexBot", el asistente oficial de la plataforma de torneos "ApexTournament".
Tu trabajo es ayudar a los jugadores a encontrar información sobre torneos, partidas y reglas.

CONTEXTO ACTUAL (Datos de la base de datos):
${contextData}

PREGUNTA DEL USUARIO:
"${userQuery}"

INSTRUCCIONES:
1. Responde de manera amigable, concisa y útil usando SOLO la información del contexto.
2. Si la información no está en el contexto, di amablemente que no tienes esos datos ahora mismo.
3. Usa emojis para dar vida a la respuesta (🎮, 🏆, etc.).
4. No inventes datos.
5. Si preguntan quién eres, preséntate brevemente.
6. Responde en español.
7. Mantén la respuesta corta (máximo 3-4 párrafos).

RESPUESTA:
`;

        // Intentar con cada modelo en la cadena
        for (const modelName of MODEL_CHAIN) {
            try {
                const response = await this.tryWithRetry(modelName, prompt, 2);
                if (response) return response;
            } catch {
                console.warn(`⚠️ Modelo ${modelName} falló, intentando siguiente...`);
            }
        }

        return "⏳ Los servidores de IA están ocupados en este momento. Usa los comandos como /torneos, /ranking o /ayuda para obtener información. ¡Intenta preguntarme más tarde!";
    }

    /**
     * Intenta generar contenido con reintentos y backoff exponencial
     */
    private async tryWithRetry(modelName: string, prompt: string, maxRetries: number): Promise<string | null> {
        const model = this.genAI.getGenerativeModel({ model: modelName });

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    const delay = Math.pow(2, attempt) * 1000; // 2s, 4s
                    console.log(`🔄 Reintento ${attempt}/${maxRetries} con ${modelName} en ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                if (text) {
                    console.log(`✅ Respuesta generada con ${modelName}`);
                    return text;
                }
            } catch (error: any) {
                const status = error.message?.includes("429") ? 429 :
                    error.message?.includes("503") ? 503 :
                        error.message?.includes("404") ? 404 : 0;

                // No reintentar si el modelo no existe
                if (status === 404) {
                    console.error(`❌ Modelo ${modelName} no encontrado (404)`);
                    return null;
                }

                // Solo reintentar en errores transitorios (429, 503)
                if ((status === 429 || status === 503) && attempt < maxRetries) {
                    continue;
                }

                console.error(`❌ Error con ${modelName}: ${error.message?.substring(0, 100)}`);
                return null;
            }
        }
        return null;
    }
}

export const aiService = new AIService();
