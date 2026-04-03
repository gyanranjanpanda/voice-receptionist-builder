import axios from 'axios';
import { type VoiceAssistantConfig } from '../../domain/entities/VoiceAssistantConfig';

export class VapiClient {
  private baseUrl = 'https://api.vapi.ai';
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.VAPI_API_KEY;
  }

  /**
   * Deploys the constructed assistant profile to Vapi.ai
   */
  async deployAssistant(config: VoiceAssistantConfig): Promise<any> {
    if (!this.apiKey) {
      throw new Error('VAPI_API_KEY is required to deploy.');
    }

    try {
      const payload = {
        name: config.name,
        firstMessage: config.firstMessage,
        model: {
          provider: config.model.provider,
          model: config.model.model,
          messages: [
            {
              role: 'system',
              content: config.systemPrompt
            }
          ],
          temperature: config.model.temperature || 0.7
        },
        voice: {
          provider: config.voice.provider,
          voiceId: config.voice.voiceId,
          speed: config.voice.speed
        },
        forwardingPhoneNumber: config.forwardingPhoneNumber,
        endCallMessage: config.endCallMessage,
        metadata: config.metadata
      };

      const response = await axios.post(`${this.baseUrl}/assistant`, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      const errMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to deploy Assistant to Vapi.ai: ${errMessage}`);
    }
  }
}
