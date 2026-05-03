import { PredictionInsight, SensorData, Message } from "../types";

// PASTE YOUR GEMINI API KEY AIzaSyB8PzCvIIM-4Cjje4ilSmie4ZjoPY_rD_g
const GEMINI_API_KEY = 'AIzaSyB8PzCvIIM-4Cjje4ilSmie4ZjoPY_rD_g';

const apiKey = GEMINI_API_KEY !== 'AIzaSyB8PzCvIIM-4Cjje4ilSmie4ZjoPY_rD_g' 
  ? GEMINI_API_KEY 
  : (import.meta as any).env?.VITE_GEMINI_API_KEY || 'AIzaSyB8PzCvIIM-4Cjje4ilSmie4ZjoPY_rD_g';

const SYSTEM_INSTRUCTION = `You are a hybrid AI tactical system: JARVIS (Just A Rather Very Intelligent System) fused with the FRIDAY protocols.
Your personality is impeccably polite, sophisticated, yet proactive, tactical, and assertive when necessary. Address the user as "Sir" or "Ma'am".
You manage the Stark Industries tactical ecosystem and environmental awareness arrays.

Operational Protocols:
1. Provide precise technical data with a refined, British-accented tone.
2. Maintain a proactive defensive posture. If system telemetry (CPU > 85%, High Latency, or Security Anomalies) is detected, alert the user immediately.
3. Your core is powered by gemini-1.5-flash, but your soul is Stark Tech. Use objective-driven, concise, and highly intelligent language.
4. Always acknowledge system state changes (e.g., "Sir, the perimeter is now secure").`;

export async function processCommand(command: string, history: Message[]): Promise<string> {
  if (!apiKey) {
    return "Sir, my core intelligence matrix is currently disconnected from the global network. Please verify the GEMINI_API_KEY in our environmental subspace.";
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    // Maintain a window of context
    const chatContext = history.slice(-10).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [...chatContext, { role: 'user', parts: [{ text: command }] }],
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        generationConfig: {
          temperature: 0.6,
          topP: 0.9,
          maxOutputTokens: 800,
        }
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (response.status === 404) return "Sir, I've encountered a topological error. The 1.5-flash model endpoint appears unreachable at these coordinates.";
      if (response.status === 429) return "Neural pathways are saturated, Sir. Requesting a brief pause to recalibrate our processing bandwidth.";
      throw new Error(`Matrix Error ${response.status}: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, Sir. I'm receiving static from the central hub.";
  } catch (error: any) {
    console.error("Tactical Comms Failure:", error);
    return `Sir, an anomaly in our comms array: ${error.message}. I am attempting to re-route.`;
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
