import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function findLogos() {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Find the official IPL team logo URLs for the 10 current teams: CSK, MI, RCB, KKR, SRH, GT, PBKS, DC, LSG, RR. Return a JSON object where keys are team short names and values are the official logo URLs. Prefer URLs from official CDNs or the iplt20.com website.",
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
    },
  });

  console.log(response.text);
}

findLogos();
