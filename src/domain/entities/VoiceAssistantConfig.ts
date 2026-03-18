export interface StandardMessage {
  role: 'assistant' | 'user' | 'system';
  content: string;
}

export interface VoiceAssistantConfig {
  name: string;
  firstMessage: string;
  systemPrompt: string;
  voice: {
    provider: string; // e.g., 'playht', 'elevenlabs', 'azure'
    voiceId: string;
    speed?: number;
    temperature?: number;
  };
  model: {
    provider: string; // e.g., 'openai'
    model: string;    // e.g., 'gpt-4o'
    temperature?: number;
  };
  metadata: Record<string, any>; // Used to pass arbitrary data downstream
  forwardingPhoneNumber?: string;
  endCallMessage?: string;
}
