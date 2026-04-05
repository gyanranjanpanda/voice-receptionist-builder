export interface StandardMessage {
  role: 'assistant' | 'user' | 'system';
  content: string;
}

export interface ToolParameterProperty {
  type: string;
  description?: string;
  default?: string;
  enum?: string[];
}

export interface ToolFunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, ToolParameterProperty>;
    required?: string[];
  };
}

export interface AssistantToolDefinition {
  type: string;
  function: ToolFunctionDefinition;
  server?: { url: string; secret?: string };
}

export interface VoiceAssistantConfig {
  name: string;
  firstMessage: string;
  systemPrompt: string;
  voice: {
    provider: string;
    voiceId: string;
    speed?: number;
    temperature?: number;
  };
  model: {
    provider: string;
    model: string;
    temperature?: number;
  };
  tools?: AssistantToolDefinition[];
  metadata: Record<string, unknown>;
  forwardingPhoneNumber?: string;
  endCallMessage?: string;
}
