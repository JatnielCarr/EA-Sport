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

    // =====================================================
    // CORE: Generate with retry + model fallback
    // =====================================================
    private async tryWithRetry(modelName: string, prompt: string, maxRetries: number): Promise<string | null> {
        const model = this.genAI.getGenerativeModel({ model: modelName });

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    const delay = Math.pow(2, attempt) * 1000;
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

                if (status === 404) {
                    console.error(`❌ Modelo ${modelName} no encontrado (404)`);
                    return null;
                }

                if ((status === 429 || status === 503) && attempt < maxRetries) {
                    continue;
                }

                console.error(`❌ Error con ${modelName}: ${error.message?.substring(0, 100)}`);
                return null;
            }
        }
        return null;
    }

    private async generate(prompt: string): Promise<string> {
        for (const modelName of MODEL_CHAIN) {
            try {
                const response = await this.tryWithRetry(modelName, prompt, 2);
                if (response) return response;
            } catch {
                console.warn(`⚠️ Modelo ${modelName} falló, intentando siguiente...`);
            }
        }
        return "⏳ Los servidores de IA están ocupados. Intenta más tarde.";
    }

    // =====================================================
    // 1. CHATBOT — Conversational assistant
    // =====================================================
    async chat(userQuery: string, contextData: string, pageContext?: string): Promise<string> {
        const prompt = `
Eres "ApexBot", el asistente oficial de la plataforma de torneos "ApexTournament".
Tu trabajo es ayudar a los jugadores a encontrar información sobre torneos, partidas y reglas.

CONTEXTO ACTUAL (Datos de la base de datos):
${contextData}

${pageContext ? `PÁGINA ACTUAL DEL USUARIO: ${pageContext}` : ""}

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
        return this.generate(prompt);
    }

    // Alias for backward compatibility with Telegram bot
    async generateResponse(userQuery: string, contextData: string): Promise<string> {
        return this.chat(userQuery, contextData);
    }

    // =====================================================
    // 2. DESCRIPTION GENERATION
    // =====================================================
    async generateDescription(type: "tournament" | "clan", params: Record<string, any>): Promise<string> {
        const prompt = type === "tournament"
            ? `Genera una descripción atractiva y profesional para un torneo de esports con estos datos:
- Nombre: ${params.name || "N/A"}
- Juego: ${params.game || "N/A"}
- Formato: ${params.format || "N/A"}
- Tamaño de equipo: ${params.teamSize || "N/A"}
- Máx participantes: ${params.maxParticipants || "N/A"}
- Región: ${params.region || "N/A"}
- Cuota de entrada: ${params.entryFee || "Gratis"}
- Premio: ${params.prizePool || "N/A"}

INSTRUCCIONES:
1. Escribe 2-3 párrafos máximo
2. Tono competitivo y emocionante
3. Usa emojis con moderación (🏆, 🎮, ⚔️)
4. En español
5. No incluyas información que no se proporcionó
6. Devuelve SOLO la descripción, sin títulos ni encabezados`
            : `Genera una descripción atractiva para un clan/equipo de gaming con estos datos:
- Nombre: ${params.name || "N/A"}
- Tag: ${params.tag || "N/A"}
- Ubicación: ${params.location || "N/A"}
- Tipo de acceso: ${params.accessType || "N/A"}

INSTRUCCIONES:
1. Escribe 1-2 párrafos máximo
2. Tono de comunidad unida y competitiva
3. Usa emojis con moderación
4. En español
5. Devuelve SOLO la descripción, sin títulos ni encabezados`;

        return this.generate(prompt);
    }

    // =====================================================
    // 3. SMART SEARCH
    // =====================================================
    async smartSearch(query: string, availableData: string): Promise<{ intent: string; filters: Record<string, any>; summary: string }> {
        const prompt = `Analiza esta consulta de búsqueda de un usuario en una plataforma de torneos de esports:

CONSULTA: "${query}"

DATOS DISPONIBLES:
${availableData}

Responde SOLO con un JSON válido (sin markdown, sin backticks) con esta estructura:
{
  "intent": "search_tournaments" | "search_players" | "search_clans" | "search_games" | "general_info",
  "filters": {
    "game": "nombre del juego o null",
    "status": "REGISTRATION_OPEN | IN_PROGRESS | COMPLETED | null",
    "format": "SINGLE_ELIMINATION | DOUBLE_ELIMINATION | ROUND_ROBIN | SWISS | null",
    "region": "región o null",
    "free_only": true/false
  },
  "summary": "breve resumen en español de lo que el usuario busca"
}`;

        const response = await this.generate(prompt);
        try {
            const cleaned = response.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleaned);
        } catch {
            return { intent: "general_info", filters: {}, summary: query };
        }
    }

    // =====================================================
    // 4. MATCH PREDICTIONS
    // =====================================================
    async predictMatch(team1Data: Record<string, any>, team2Data: Record<string, any>): Promise<{ team1Chance: number; team2Chance: number; analysis: string }> {
        const prompt = `Analiza estos dos equipos/jugadores de esports y predice quién tiene más probabilidad de ganar:

EQUIPO 1: ${JSON.stringify(team1Data)}
EQUIPO 2: ${JSON.stringify(team2Data)}

Responde SOLO con un JSON válido (sin markdown, sin backticks):
{
  "team1Chance": número entre 0 y 100,
  "team2Chance": número entre 0 y 100 (debe sumar 100 con team1Chance),
  "analysis": "análisis breve en español de por qué (1-2 oraciones)"
}`;

        const response = await this.generate(prompt);
        try {
            const cleaned = response.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleaned);
        } catch {
            return { team1Chance: 50, team2Chance: 50, analysis: "No hay suficientes datos para una predicción precisa." };
        }
    }

    // =====================================================
    // 5. SMART SEEDING
    // =====================================================
    async generateSmartSeeding(teamsData: Array<Record<string, any>>): Promise<Array<{ teamId: string; seed: number; reason: string }>> {
        const prompt = `Eres un experto en esports. Analiza estos equipos y asigna seeds (posiciones) para un bracket de torneo.
Los equipos con mejor rendimiento deben tener seeds más bajos (1 = mejor equipo).

EQUIPOS:
${JSON.stringify(teamsData, null, 2)}

Responde SOLO con un JSON array válido (sin markdown, sin backticks):
[
  { "teamId": "id del equipo", "seed": número, "reason": "razón breve en español" }
]

Ordena por seed ascendente (1 primero).`;

        const response = await this.generate(prompt);
        try {
            const cleaned = response.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleaned);
        } catch {
            return teamsData.map((t, i) => ({ teamId: t.id || t.teamId, seed: i + 1, reason: "Seed por defecto" }));
        }
    }

    // =====================================================
    // 6. PLAYER INSIGHTS / DASHBOARD
    // =====================================================
    async generateInsights(playerData: Record<string, any>): Promise<{ summary: string; tips: string[]; strengths: string[]; weaknesses: string[] }> {
        const prompt = `Analiza el rendimiento de este jugador de esports y genera insights personalizados:

DATOS DEL JUGADOR:
${JSON.stringify(playerData, null, 2)}

Responde SOLO con un JSON válido (sin markdown, sin backticks):
{
  "summary": "resumen de 2-3 oraciones del rendimiento general en español",
  "tips": ["consejo 1", "consejo 2", "consejo 3"],
  "strengths": ["fortaleza 1", "fortaleza 2"],
  "weaknesses": ["área de mejora 1", "área de mejora 2"]
}`;

        const response = await this.generate(prompt);
        try {
            const cleaned = response.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleaned);
        } catch {
            return {
                summary: "No hay suficientes datos para generar un análisis detallado.",
                tips: ["Participa en más torneos para generar datos"],
                strengths: [],
                weaknesses: []
            };
        }
    }

    // =====================================================
    // 7. TOURNAMENT RECOMMENDATIONS
    // =====================================================
    async recommendTournaments(userProfile: Record<string, any>, availableTournaments: Array<Record<string, any>>): Promise<Array<{ tournamentId: string; score: number; reason: string }>> {
        const prompt = `Eres un recomendador de torneos de esports. Basándote en el perfil del jugador, recomienda los mejores torneos de la lista.

PERFIL DEL JUGADOR:
${JSON.stringify(userProfile, null, 2)}

TORNEOS DISPONIBLES:
${JSON.stringify(availableTournaments.slice(0, 15), null, 2)}

Responde SOLO con un JSON array válido (sin markdown, sin backticks) con máximo 5 recomendaciones:
[
  { "tournamentId": "id", "score": 1-100, "reason": "razón breve en español" }
]

Ordena por score descendente (más relevante primero).`;

        const response = await this.generate(prompt);
        try {
            const cleaned = response.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleaned);
        } catch {
            return [];
        }
    }

    // =====================================================
    // 8. TOURNAMENT SUMMARY (Post-tournament)
    // =====================================================
    async summarizeTournament(tournamentData: Record<string, any>): Promise<string> {
        const prompt = `Genera un resumen narrativo épico de este torneo de esports que acaba de terminar:

DATOS DEL TORNEO:
${JSON.stringify(tournamentData, null, 2)}

INSTRUCCIONES:
1. Escribe un resumen de 3-4 párrafos máximo
2. Tono épico y emocionante, como una crónica deportiva
3. Menciona al campeón y momentos clave
4. Usa emojis con moderación
5. En español
6. Devuelve SOLO el resumen, sin títulos`;

        return this.generate(prompt);
    }

    // =====================================================
    // 9. CONTENT MODERATION
    // =====================================================
    async moderateContent(message: string): Promise<{ safe: boolean; reason: string; severity: "none" | "low" | "medium" | "high" }> {
        const prompt = `Analiza este mensaje de chat de una plataforma de gaming y determina si es apropiado:

MENSAJE: "${message}"

Responde SOLO con un JSON válido (sin markdown, sin backticks):
{
  "safe": true/false,
  "reason": "razón breve si no es seguro, o 'Contenido apropiado'",
  "severity": "none" | "low" | "medium" | "high"
}

CRITERIOS:
- "high": discurso de odio, amenazas, acoso grave
- "medium": insultos fuertes, lenguaje muy agresivo
- "low": lenguaje ligeramente inapropiado
- "none": contenido seguro`;

        const response = await this.generate(prompt);
        try {
            const cleaned = response.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleaned);
        } catch {
            return { safe: true, reason: "No se pudo analizar", severity: "none" };
        }
    }

    // =====================================================
    // 10. ANTI-CHEAT ANALYSIS
    // =====================================================
    async analyzeForCheating(matchData: Array<Record<string, any>>): Promise<{ suspicious: boolean; flags: string[]; confidence: number; details: string }> {
        const prompt = `Eres un analista anti-trampas de esports. Analiza estos datos de partidos y busca patrones sospechosos:

DATOS DE PARTIDOS:
${JSON.stringify(matchData, null, 2)}

PATRONES A BUSCAR:
- Win rates anormalmente altos para cuentas nuevas (smurfing)
- Resultados demasiado predecibles o patrones de match-fixing
- Mejoras de rendimiento súbitas e inexplicables
- Puntuaciones idénticas o sospechosas en múltiples partidos

Responde SOLO con un JSON válido (sin markdown, sin backticks):
{
  "suspicious": true/false,
  "flags": ["flag1", "flag2"],
  "confidence": 0-100,
  "details": "explicación breve en español"
}`;

        const response = await this.generate(prompt);
        try {
            const cleaned = response.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleaned);
        } catch {
            return { suspicious: false, flags: [], confidence: 0, details: "No se detectaron anomalías." };
        }
    }

    // =====================================================
    // 11. PLAYER PERFORMANCE ANALYSIS
    // =====================================================
    async analyzePlayerPerformance(playerData: Record<string, any>): Promise<{ rating: string; trend: string; analysis: string; recommendations: string[] }> {
        const prompt = `Analiza el rendimiento detallado de este jugador de esports:

DATOS DEL JUGADOR:
${JSON.stringify(playerData, null, 2)}

Responde SOLO con un JSON válido (sin markdown, sin backticks):
{
  "rating": "S" | "A" | "B" | "C" | "D" (rating general del jugador),
  "trend": "improving" | "stable" | "declining",
  "analysis": "análisis detallado en español de 2-3 oraciones",
  "recommendations": ["recomendación 1", "recomendación 2", "recomendación 3"]
}`;

        const response = await this.generate(prompt);
        try {
            const cleaned = response.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleaned);
        } catch {
            return {
                rating: "B",
                trend: "stable",
                analysis: "No hay suficientes datos para un análisis completo.",
                recommendations: ["Participa en más torneos para mejorar tu perfil"]
            };
        }
    }
}

export const aiService = new AIService();
