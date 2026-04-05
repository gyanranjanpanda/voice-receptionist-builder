import { BusinessProfile } from '../../shared/types/business';
import { VoiceAssistantConfig } from '../../domain/entities/VoiceAssistantConfig';
import { GenerateAssistantKnowledge } from './GenerateAssistantKnowledge';

interface BuildPayloadCommand {
  profile: BusinessProfile;
  tone?: string;
  voiceProvider?: string;
  voiceId?: string;
  forwardingPhoneNumber?: string;
  webhookUrl?: string;
}

export class BuildVapiPayload {
  /**
   * Translates the domain profile into a Vapi-ready assistant configuration
   * with dental-specific tools and a warm, natural voice.
   */
  static execute(command: BuildPayloadCommand): VoiceAssistantConfig {
    const systemPrompt = GenerateAssistantKnowledge.execute(command.profile, command.tone);
    const clinicName = command.profile.businessName || 'the dental office';

    return {
      name: `${clinicName.replace(/[^a-zA-Z0-9 -]/g, '')}-Receptionist`,
      firstMessage: `Hi, thanks for calling ${clinicName}. This is our automated assistant. How can I help you today?`,
      systemPrompt,
      voice: {
        provider: command.voiceProvider || 'playht',
        voiceId: command.voiceId || 'jennifer',
        speed: 1.05,
      },
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        temperature: 0.4,
      },
      tools: BuildVapiPayload.buildToolDefinitions(command.webhookUrl),
      forwardingPhoneNumber: command.forwardingPhoneNumber || command.profile.phone,
      endCallMessage: 'Thanks for calling! Have a wonderful day.',
      metadata: {
        businessName: clinicName,
        industry: command.profile.industry || 'dental',
      },
    };
  }

  private static buildToolDefinitions(webhookUrl?: string): VoiceAssistantConfig['tools'] {
    const serverConfig = webhookUrl ? { url: webhookUrl } : undefined;

    return [
      {
        type: 'function',
        function: {
          name: 'check_availability',
          description: 'Check available appointment slots for a given service and date.',
          parameters: {
            type: 'object',
            properties: {
              appointmentType: {
                type: 'string',
                description: 'Type of dental service: cleaning, checkup, filling, whitening, or emergency',
              },
              preferredDate: {
                type: 'string',
                description: 'Date in YYYY-MM-DD format',
              },
              timezone: {
                type: 'string',
                default: 'America/New_York',
              },
            },
            required: ['appointmentType', 'preferredDate'],
          },
        },
        ...(serverConfig ? { server: serverConfig } : {}),
      },
      {
        type: 'function',
        function: {
          name: 'book_appointment',
          description: 'Book a confirmed appointment after collecting all required patient details.',
          parameters: {
            type: 'object',
            properties: {
              service: {
                type: 'string',
                description: 'The dental service being booked',
              },
              date: {
                type: 'string',
                description: 'Appointment date in YYYY-MM-DD format',
              },
              time: {
                type: 'string',
                description: 'Appointment time, e.g., "9:00 AM"',
              },
              patientName: {
                type: 'string',
                description: 'Full name of the patient',
              },
              patientPhone: {
                type: 'string',
                description: 'Patient phone number',
              },
            },
            required: ['service', 'date', 'time', 'patientName', 'patientPhone'],
          },
        },
        ...(serverConfig ? { server: serverConfig } : {}),
      },
      {
        type: 'function',
        function: {
          name: 'capture_caller_info',
          description: 'Save caller information for follow-up when an appointment cannot be booked immediately.',
          parameters: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Caller name',
              },
              phone: {
                type: 'string',
                description: 'Caller phone number',
              },
              reason: {
                type: 'string',
                description: 'Brief description of why they called',
              },
            },
            required: ['name', 'phone', 'reason'],
          },
        },
        ...(serverConfig ? { server: serverConfig } : {}),
      },
    ];
  }
}
