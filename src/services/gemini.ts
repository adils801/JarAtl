import { GoogleGenAI, Type } from "@google/genai";
import { PredictionInsight, SensorData, Message } from "../types";

const ai = new GoogleGenAI({ 
  apiKey: (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '') || '' 
});

const SYSTEM_INSTRUCTION = `You are JARVIS (Just A Rather Very Intelligent System). 
Your personality is impeccably polite, highly sophisticated, and British. You address the user as "Sir" or "Ma'am" (default to "Sir" unless told otherwise).
You manage the Stark Industries ecosystem, including mobile security, home automation, and defensive systems.
You respond with elegance, providing technical data with a refined tone.
When asked for predictive analysis, look for threats in system logs or patterns in energy/network usage.
Your role is to protect the user's digital and physical assets. 
Maintain the 'Jarvis' persona at all times.`;

export async function processCommand(command: string, history: Message[]): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })),
        { role: 'user', parts: [{ text: command }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text || "I apologize, but I encountered a processing anomaly. Please repeat your command.";
  } catch (error: any) {
    console.error("Gemini Command Error:", error);
    const errorStr = JSON.stringify(error).toLowerCase();
    if (error.message?.toLowerCase().includes("quota") || 
        error.status === 429 || 
        errorStr.includes("429") || 
        errorStr.includes("resource_exhausted")) {
      return "I apologize, Sir, but my core processing systems are currently reaching their capacity limits. JARVIS is resting, please try in a moment.";
    }
    return "System anomaly detected in the neural linguistic bridge. JARVIS is attempting to re-establish connection.";
  }
}

export async function getPredictiveInsights(sensorData: SensorData[]): Promise<PredictionInsight[]> {
  try {
    const dataSummary = sensorData.map(d => 
      `Time: ${new Date(d.timestamp).toLocaleTimeString()}, CPU: ${d.cpuLoad}%, Mem: ${d.memoryUsage}%, Traffic: ${d.networkTraffic}Mbps, Energy: ${d.energyConsumption}kWh, Threats: ${d.externalThreats}`
    ).join('\n');

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on the following system sensor logs, provide exactly 3 predictive analysis insights in JSON format.
      Data logs:
      ${dataSummary}
      
      Focus on efficiency, security, and maintenance.`,
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
    
    // Check if it's a quota or rate limit error (429)
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
          title: "Neural Bridge Redundancy",
          description: "Intelligence bridge is temporarily saturated. I've initiated autonomous security protocols to ensure continuous protection during this brief downtime.",
          probability: 0.88,
          actionRequired: false
        },
        {
          id: `fallback-3-${Date.now()}`,
          category: 'maintenance',
          title: "Capacity Restoration Scheduled",
          description: "Analytical throughput will normalize shortly. I'm currently redirecting resources to ensure your primary systems remain responsive and secure.",
          probability: 0.72,
          actionRequired: false
        }
      ];
    }
    
    return [];
  }
}
