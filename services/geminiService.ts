
import { GoogleGenAI } from "@google/genai";
import { Match } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMatch = async (match: Match): Promise<string> => {
  try {
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "Analysis unavailable. Please check API configuration.";
  }
};
