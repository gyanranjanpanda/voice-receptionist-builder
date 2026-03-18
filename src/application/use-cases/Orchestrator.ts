import { WebsiteScraper } from '../../infrastructure/scraping/WebsiteScraper';
import { OpenAIExtractor } from '../../infrastructure/llm/OpenAIExtractor';
import { ConfidenceValidator, ReviewFlag } from '../../domain/services/ConfidenceValidator';
import { BuildVapiPayload } from './BuildVapiPayload';
import { VapiClient } from '../../infrastructure/vapi/VapiClient';
import { VoiceAssistantConfig } from '../../domain/entities/VoiceAssistantConfig';
import { BusinessProfile } from '../../shared/types/business';

export interface BuildRunResult {
  profile: BusinessProfile;
  flags: ReviewFlag[];
  config: VoiceAssistantConfig;
}

export class Orchestrator {
  constructor(
    private extractor: OpenAIExtractor = new OpenAIExtractor(),
    private vapiClient: VapiClient = new VapiClient()
  ) {}

  /**
   * Step 1-6: End-to-end pipeline up to the deployment review gate.
   * Scrapes -> Extracts -> Normalizes -> Scores -> Generates Config.
   */
  async buildAssistantFromUrl(url: string, businessType?: string, tone?: string): Promise<BuildRunResult> {
    // Stage 1: Ingestion
    const htmlText = await WebsiteScraper.scrapeHtml(url);

    // Stage 2: Extraction & Normalization
    const profile = await this.extractor.extractProfile(htmlText, businessType);

    // Stage 3: Confidence & Risk Scoring
    const flags = ConfidenceValidator.validateProfile(profile);

    // Stage 4: Assistant Generation & Payload Mapping
    const config = BuildVapiPayload.execute({ profile, tone });

    return { profile, flags, config };
  }

  /**
   * Step 7: Push approved configuration to Vapi infrastructure.
   */
  async deploy(config: VoiceAssistantConfig): Promise<string> {
    const result = await this.vapiClient.deployAssistant(config);
    return result.id; // Returns the generated Vapi Assistant ID string
  }
}
