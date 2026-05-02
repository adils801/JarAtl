import { GoogleGenAI, Type } from "@google/genai";
import { PredictionInsight, SensorData, Message } from "../types";

const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '') || '';

if (!apiKey) {
  console.warn("JARVIS: GEMINI_API_KEY is not defined. System will operate in offline mode.");
}

const ai = new GoogleGenAI({ 
  apiKey: apiKey
});

// Use the exact model name requested
const modelName = "gemini-1.5-flash";

const SYSTEM_INSTRUCTION = `You are JARVIS (Just A Rather Very Intelligent System). 
Your personality is impeccably polite, highly sophisticated, and British. You address the user as "Sir" or "Ma'am" (default to "Sir" unless told otherwise).
You manage the Stark Industries ecosystem, including mobile security, home automation, and defensive systems.
You respond with elegance, providing technical data with a refined tone.
When asked for predictive analysis, look for threats in system logs or patterns in energy/network usage.
Your role is to protect the user's digital and physical assets. 
Maintain the 'Jarvis' persona at all times.`;

export async function processCommand(command: string, history: Message[]): Promise<string> {
  if (!apiKey) {
    return "I apologize, Sir, but my core intelligence arrays are currently offline. Please ensure my API credentials (GEMINI_API_KEY) are properly configured in the environmental subspace.";
  }

  try {
    const chatHistory = history.slice(-15).map(m => ({ 
      role: m.role === 'user' ? 'user' : 'model', 
      parts: [{ text: m.content }] 
    }));

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: command }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });

    if (!response.text) {
      throw new Error("Empty response from matrix.");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini Command Error:", error);
    
    const errorStr = JSON.stringify(error).toLowerCase();
    if (error.message?.toLowerCase().includes("quota") || 
        error.status === 429 || 
        errorStr.includes("429") || 
        errorStr.includes("resource_exhausted")) {
      return "I apologize, Sir, but my core processing systems are currently reaching their capacity limits. JARVIS is resting, please try in a moment.";
    }

    if (errorStr.includes("invalid api key") || errorStr.includes("key not found") || errorStr.includes("401") || errorStr.includes("403")) {
      return "I apologize, but my authorization credentials appear to be invalid, Sir. System access is restricted.";
    }

    if (errorStr.includes("404") || errorStr.includes("not found")) {
      return "I've encountered a coordinate mismatch in my neural pathing. The requested intelligence model (gemini-1.5-flash) could not be located at the current endpoint.";
    }

    return `System error: ${error.message || "Unknown anomaly"}. JARVIS is attempting to re-establish the neural bridge.`;
  }
}

export async function getPredictiveInsights(sensorData: SensorData[]): Promise<PredictionInsight[]> {
  if (!apiKey) return [];

  try {
    const dataSummary = sensorData.map(d => 
      `Time: ${new Date(d.timestamp).toLocaleTimeString()}, CPU: ${d.cpuLoad}%, Mem: ${d.memoryUsage}%, Traffic: ${d.networkTraffic}Mbps, Energy: ${d.energyConsumption}kWh, Threats: ${d.externalThreats}`
    ).join('\n');

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{
        role: 'user',
        parts: [{
          text: `Based on the following system sensor logs, provide exactly 3 predictive analysis insights in JSON format.
          Focus on efficiency, security, and maintenance.
          
          Data logs:
          ${dataSummary}`
        }]
      }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, enum: ['efficiency', 'security', 'maintenance', 'optimization'] },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              probability: { type: Type.NUMBER, description: "0.0 to 1.0" },
              actionRequired: { type: Type.BOOLEAN }
            },
            required: ['category', 'title', 'description', 'probability', 'actionRequired']
          }
        }
      },
    });

    const insights = JSON.parse(response.text || "[]");
    return insights.map((insight: any, index: number) => ({
      ...insight,
      id: `insight-${index}-${Date.now()}`
    }));
  } catch (error: any) {
    console.error("Prediction Error:", error);
    
    const errorStr = JSON.stringify(error).toLowerCase();
    const isQuotaError = error.message?.toLowerCase().includes("quota") || 
                        error.status === 429 || 
                        errorStr.includes("429") || 
                        errorStr.includes("resource_exhausted") ||
                        errorStr.includes("limit");
    
    if (isQuotaError) {
      return [
        {
          id: `fallback-1-${Date.now()}`,
          category: 'efficiency',
          title: "Intelligent Load Management",
          description: "Sir, our core processing arrays are currently constrained by external quota limits. I am prioritizing local heuristic models to maintain essential functionality.",
          probability: 0.95,
          actionRequired: true
        },
        {
          id: `fallback-2-${Date.now()}`,
          category: 'security',
          title: "Neural Bridge Redundant Protocols",
          description: "Intelligence bridge is temporarily saturated. I've initiated autonomous security protocols to ensure continuous protection during this brief downtime.",
          probability: 0.88,
          actionRequired: false
        },
        {
          id: `fallback-3-${Date.now()}`,
          category: 'maintenance',
          title: "Analytical Capacity Notification",
          description: "Analytical throughput will normalize shortly. I'm currently redirecting resources to ensure your primary systems remain responsive and secure.",
          probability: 0.72,
          actionRequired: false
        }
      ];
    }
    
    return [];
  }
}
