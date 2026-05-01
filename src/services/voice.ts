// Speech Recognition types (not in standard DOM types sometimes)
interface WindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export class VoiceAssistant {
  private static instance: VoiceAssistant;
  private recognition: any;
  private synthesis: SpeechSynthesis;
  private isListening: boolean = false;

  private constructor() {
    this.synthesis = window.speechSynthesis;
    const SpeechRecognition = (window as WindowWithSpeech).SpeechRecognition || (window as WindowWithSpeech).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    } else {
      console.warn("Speech recognition not supported in this browser.");
    }
  }

  public static getInstance(): VoiceAssistant {
    if (!VoiceAssistant.instance) {
      VoiceAssistant.instance = new VoiceAssistant();
    }
    return VoiceAssistant.instance;
  }

  public speak(text: string, onEnd?: () => void): void {
    // Cancel previous speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Give it a slightly robotic but high-quality voice if possible
    const voices = this.synthesis.getVoices();
    // Prefer Google US English or similar crisp voices
    const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang === 'en-US') || 
                          voices.find(v => v.lang === 'en-US') || 
                          voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.pitch = 0.85; // Slightly lower for more authority and depth
    utterance.rate = 1.05;  // Measured, articulate delivery
    
    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    this.synthesis.speak(utterance);
  }

  public listen(onResult: (text: string) => void, onError: (err: any) => void): void {
    if (!this.recognition) {
      onError("Speech recognition unavailable");
      return;
    }

    if (this.isListening) return;

    this.isListening = true;
    this.recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      this.isListening = false;
      onResult(result);
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
    } catch (e) {
      this.isListening = false;
      onError(e);
    }
  }

  public stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

export const jarvisVoice = VoiceAssistant.getInstance();
