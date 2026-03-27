import { ai } from "./gemini";
import { Match, TEAMS } from "../types";

export async function fetchLatestIPLMatches(): Promise<Match[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Find the latest and upcoming IPL 2026 or future match data. Return a JSON array of matches with the following structure: { id: string, homeTeamShort: string, awayTeamShort: string, startTime: string (ISO), status: 'Upcoming' | 'Live' | 'Completed', venue: string, score?: { home: string, away: string, overs?: string, statusText?: string }, result?: { winnerId: string, margin: string } }. Only use team short names from: CSK, MI, RCB, KKR, SRH, GT, PBKS, DC, LSG, RR.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) return [];

    const rawMatches = JSON.parse(text);
    
    // Map to our Match type
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
  } catch (error) {
    console.error("Error fetching IPL matches:", error);
    return [];
  }
}

export async function fetchIPLStats(): Promise<any> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Provide current IPL 2026 or future statistics including total matches played, most popular team based on social media or search trends, and average scores. Return as JSON: { totalBets: number (approximate based on popularity), mostPickedTeam: string (short name), avgCoinsWon: number, teamPopularity: { id: string, count: number }[] }.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text);
  } catch (error) {
    console.error("Error fetching IPL stats:", error);
    return null;
  }
}
