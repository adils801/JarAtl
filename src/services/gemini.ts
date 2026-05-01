import { GoogleGenAI, Type } from "@google/genai";
import { PredictionInsight, SensorData, Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

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
  } catch (error) {
    console.error("Gemini Command Error:", error);
    return "System error in linguistics processing unit. Please re-establish connection.";
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
  } catch (error) {
    console.error("Prediction Error:", error);
    return [];
  }
}
