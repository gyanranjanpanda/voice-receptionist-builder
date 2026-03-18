import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { BusinessProfileSchema, BusinessProfile } from '../../shared/types/business';

export class OpenAIExtractor {
  private openai: OpenAI;

  constructor(apiKey?: string) {
    this.openai = new OpenAI({ 
      apiKey: apiKey || process.env.OPENAI_API_KEY 
    });
  }

  /**
   * Uses OpenAI Structured Outputs to deterministically extract domain entities from raw scraped noise.
   */
  async extractProfile(text: string, businessTypeOverride?: string): Promise<BusinessProfile> {
    let systemPrompt = `You are an expert data extraction assistant. Your job is to extract business information from the scraped website text provided. 
Normalize all business hours into ISO/Standard strings. Extract FAQs, services, and pricing. Be highly accurate. DO NOT make up information if it is not present in the text.`;
    
    if (businessTypeOverride) {
      systemPrompt += `\nThe user has indicated this business is specifically categorized as: ${businessTypeOverride}. Prioritize context relative to this industry.`;
    }

    const response = await this.openai.beta.chat.completions.parse({
      model: 'gpt-4o-2024-08-06',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      response_format: zodResponseFormat(BusinessProfileSchema, 'business_profile'),
      temperature: 0.1, // Deterministic profile extraction
    });

    if (!response.choices[0].message.parsed) {
        throw new Error('Failed to parse the Business Profile structurally.');
    }

    return response.choices[0].message.parsed;
  }
}
