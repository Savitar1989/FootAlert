import { GoogleGenAI } from "@google/genai";
import { Match } from "../types";

let ai: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!ai) {
    // Lazy initialization
    const apiKey = process.env.API_KEY || ''; 
    // If no key is present, we can't make calls, but we shouldn't crash the app on load.
    if (!apiKey) {
      console.warn("Gemini API Key is missing.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export const analyzeMatch = async (match: Match): Promise<string> => {
  try {
    const client = getAiClient();
    
    const prompt = `
      Act as a professional in-play football trader.
      Analyze this match snapshot and give a tactical verdict (max 3 sentences).
      
      Match: ${match.homeTeam} vs ${match.awayTeam} (${match.league})
      Minute: ${match.minute}'
      Score: ${match.stats.home.goals} - ${match.stats.away.goals}
      
      Stats (Home / Away):
      - Possession: ${match.stats.home.possession}% / ${match.stats.away.possession}%
      - Shots on Target: ${match.stats.home.shotsOnTarget} / ${match.stats.away.shotsOnTarget}
      - Corners: ${match.stats.home.corners} / ${match.stats.away.corners}
      - Dangerous Attacks: ${match.stats.home.dangerousAttacks} / ${match.stats.away.dangerousAttacks}
      - Cards (Y/R): ${match.stats.home.yellowCards}/${match.stats.home.redCards} vs ${match.stats.away.yellowCards}/${match.stats.away.redCards}

      Is there a goal coming? Which side is pressuring?
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "Analysis unavailable. Please check API configuration.";
  }
};