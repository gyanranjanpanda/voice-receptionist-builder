import { BusinessProfile } from '../../shared/types/business';
import { VoiceAssistantConfig } from '../../domain/entities/VoiceAssistantConfig';
import { GenerateAssistantKnowledge } from './GenerateAssistantKnowledge';

interface BuildPayloadCommand {
  profile: BusinessProfile;
  tone?: string;
  voiceProvider?: string;
  voiceId?: string;
  forwardingPhoneNumber?: string;
}

export class BuildVapiPayload {
  /**
   * Translates the domain profile and prompt into a standard Vapi Configuration Object.
   */
  static execute(command: BuildPayloadCommand): VoiceAssistantConfig {
    const systemPrompt = GenerateAssistantKnowledge.execute(command.profile, command.tone);

    return {
      name: `${command.profile.businessName.replace(/[^a-zA-Z0-9-]/g, '')}-Receptionist`,
      firstMessage: `Hello, you've reached ${command.profile.businessName}. How can I help you today?`,
      systemPrompt,
      voice: {
        provider: command.voiceProvider || 'playht',
        voiceId: command.voiceId || 'jennifer',
        speed: 1.0
      },
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        temperature: 0.7
      },
      forwardingPhoneNumber: command.forwardingPhoneNumber || command.profile.phone,
      endCallMessage: 'Thank you for calling. Have a great day!',
      metadata: {
        businessName: command.profile.businessName,
        industry: command.profile.industry || 'unknown'
      }
    };
  }
}
