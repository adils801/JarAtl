import { PredictionInsight, SensorData, Message } from "../types";

const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

if (!apiKey) {
  console.warn("JARVIS: VITE_GEMINI_API_KEY is not defined. System will operate in offline mode.");
}

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

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const chatHistory = history.slice(-15).map(m => ({ 
      role: m.role === 'user' ? 'user' : 'model', 
      parts: [{ text: m.content }] 
    }));

    const body = {
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: command }] }
      ],
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("Gemini API Error:", response.status, errData);
      
      if (response.status === 401 || response.status === 403) {
        return "I apologize, but my authorization credentials appear to be invalid, Sir. System access is restricted.";
      }
      if (response.status === 429) {
        return "I apologize, Sir, but my core processing systems are currently reaching their capacity limits. JARVIS is resting, please try in a moment.";
      }
      if (response.status === 404) {
        return "I've encountered a coordinate mismatch in my neural pathing. The requested intelligence model (gemini-1.5-flash) could not be located at the current endpoint.";
      }
      
      throw new Error(`API returned ${response.status}: ${JSON.stringify(errData)}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Empty response from matrix.");
    }

    return text;
  } catch (error: any) {
    console.error("Gemini Command Error:", error);
    return `System error: ${error.message || "Unknown anomaly"}. JARVIS is attempting to re-establish the neural bridge.`;
  }
}

export async function getPredictiveInsights(sensorData: SensorData[]): Promise<PredictionInsight[]> {
  if (!apiKey) return [];

  // Use the same endpoint but with specific prompt and JSON request
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const dataSummary = sensorData.map(d => 
      `Time: ${new Date(d.timestamp).toLocaleTimeString()}, CPU: ${d.cpuLoad}%, Mem: ${d.memoryUsage}%, Traffic: ${d.networkTraffic}Mbps, Energy: ${d.energyConsumption}kWh, Threats: ${d.externalThreats}`
    ).join('\n');

    const body = {
      contents: [{
        role: 'user',
        parts: [{
          text: `Based on the following system sensor logs, provide exactly 3 predictive analysis insights in JSON format.
          Focus on efficiency, security, and maintenance.
          Return a JSON array of objects with the following structure:
          { "category": "efficiency" | "security" | "maintenance" | "optimization", "title": string, "description": string, "probability": number (0-1), "actionRequired": boolean }
          
          Data logs:
          ${dataSummary}`
        }]
      }],
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) return [];

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const insights = JSON.parse(text || "[]");
    
    return insights.map((insight: any, index: number) => ({
      ...insight,
      id: `insight-${index}-${Date.now()}`
    }));
  } catch (error) {
    console.error("Prediction Error:", error);
    return [];
  }
}
