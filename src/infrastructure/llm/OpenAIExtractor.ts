import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { BusinessProfileSchema, type BusinessProfile } from '../../shared/types/business';

export class OpenAIExtractor {
  private openai!: OpenAI;

  constructor(apiKey?: string) {
    if (process.env.USE_MOCK !== 'true') {
      this.openai = new OpenAI({ 
        apiKey: apiKey || process.env.OPENAI_API_KEY 
      });
    }
  }

  /**
   * Uses OpenAI Structured Outputs to deterministically extract domain entities from raw scraped noise.
   */
  async extractProfile(text: string, businessTypeOverride?: string): Promise<BusinessProfile> {
    if (process.env.USE_MOCK === 'true') {
      console.log('\n[MOCK MODE] Simulating OpenAI Extraction (Free testing mode)...\n');
      return {
        businessName: "Tend Dental (Mocked)",
        industry: businessTypeOverride || "dental clinic",
        phone: "1-800-555-TEND",
        email: "hello@tend.mock",
        address: "123 Mockingbird Lane, NY",
        services: [
          { name: "Teeth Cleaning", description: "Standard prophylaxis", price: "$150", confidenceScore: 0.95, requiresReview: false },
          { name: "Whitening", confidenceScore: 0.8, requiresReview: true } // Low confidence to trigger review gate
        ],
        openingHours: { "Monday - Friday": "8:00 AM - 6:00 PM" },
        faqs: [
          { question: "Do you take insurance?", answer: "Yes, we accept most major providers.", confidenceScore: 0.99 }
        ],
        bookingRules: ["Must provide 24h notice for cancellation."],
        // Explicitly leaving 'emergencyHandling' missing to trigger the Review Gate!
      };
    }

    let systemPrompt = `You are an expert data extraction assistant. Your job is to extract business information from the scraped website text provided. 
Normalize all business hours into ISO/Standard strings. Extract FAQs, services, and pricing. Be highly accurate. DO NOT make up information if it is not present in the text.`;
    
    if (businessTypeOverride) {
      systemPrompt += `\nThe user has indicated this business is specifically categorized as: ${businessTypeOverride}. Prioritize context relative to this industry.`;
    }

    // @ts-ignore - Bypass cached TS definition lag for newer beta chat parsing methods
    const response = await (this.openai.beta as any).chat.completions.parse({
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
