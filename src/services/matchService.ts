import { ai } from "./gemini";
import { Match, TEAMS } from "../types";

export async function fetchLatestIPLMatches(): Promise<Match[]> {
  const model = "gemini-3.1-pro-preview";
  const prompt = "Find the latest and upcoming IPL 2026 or future match data. Return a JSON array of matches with the following structure: { id: string, homeTeamShort: string, awayTeamShort: string, startTime: string (ISO), status: 'Upcoming' | 'Live' | 'Completed', venue: string, score?: { home: string, away: string, overs?: string, statusText?: string }, result?: { winnerId: string, margin: string } }. Only use team short names from: CSK, MI, RCB, KKR, SRH, GT, PBKS, DC, LSG, RR.";
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) return [];

    const rawMatches = JSON.parse(text);
    return rawMatches.map((m: any) => ({
      id: m.id || `m-${Date.now()}-${Math.random()}`,
      homeTeam: TEAMS[m.homeTeamShort] || TEAMS.MI,
      awayTeam: TEAMS[m.awayTeamShort] || TEAMS.CSK,
      startTime: m.startTime,
      status: m.status,
      venue: m.venue,
      score: m.score,
      result: m.result,
    }));
  } catch (error: any) {
    console.error("Error fetching IPL matches with search:", error);
    
    // Fallback: Try without search if it's a permission error
    if (error?.error?.code === 403 || error?.message?.includes("403")) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });
        const text = response.text;
        if (!text) return [];
        const rawMatches = JSON.parse(text);
        return rawMatches.map((m: any) => ({
          id: m.id || `m-${Date.now()}-${Math.random()}`,
          homeTeam: TEAMS[m.homeTeamShort] || TEAMS.MI,
          awayTeam: TEAMS[m.awayTeamShort] || TEAMS.CSK,
          startTime: m.startTime,
          status: m.status,
          venue: m.venue,
          score: m.score,
          result: m.result,
        }));
      } catch (fallbackError) {
        console.error("Error fetching IPL matches fallback:", fallbackError);
      }
    }
    return [];
  }
}

export async function fetchIPLStats(): Promise<any> {
  const model = "gemini-3.1-pro-preview";
  const prompt = "Provide current IPL 2026 or future statistics including total matches played, most popular team based on social media or search trends, and average scores. Return as JSON: { totalBets: number (approximate based on popularity), mostPickedTeam: string (short name), avgCoinsWon: number, teamPopularity: { id: string, count: number }[] }.";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error fetching IPL stats with search:", error);
    
    // Fallback: Try without search if it's a permission error
    if (error?.error?.code === 403 || error?.message?.includes("403")) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });
        const text = response.text;
        if (!text) return null;
        return JSON.parse(text);
      } catch (fallbackError) {
        console.error("Error fetching IPL stats fallback:", fallbackError);
      }
    }
    return null;
  }
}
