import { BusinessProfile } from '../../shared/types/business';

export interface ReviewFlag {
  field: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
}

export class ConfidenceValidator {
  /**
   * Scans a Business Profile to produce risk warnings for the Human Review Gate.
   */
  static validateProfile(profile: BusinessProfile): ReviewFlag[] {
    const flags: ReviewFlag[] = [];

    // Stage 1/2 Risk extraction: Contact information missing
    if (!profile.phone && !profile.email) {
      flags.push({ 
        field: 'contact', 
        issue: 'No valid phone number or email found. Clients cannot make contact.', 
        severity: 'high' 
      });
    }

    // Stage 1/2 Risk extraction: Hours missing
    if (Object.keys(profile.openingHours).length === 0) {
      flags.push({ 
        field: 'openingHours', 
        issue: 'No opening hours found. The assistant will not know when to accept calls vs forward them.', 
        severity: 'high' 
      });
    }

    // Stage 1/2 Risk extraction: Emergency missing
    if (!profile.emergencyHandling) {
      flags.push({ 
        field: 'emergencyHandling', 
        issue: 'Emergency handling protocol not found. Critical for medical/legal industries.', 
        severity: 'medium' 
      });
    }

    // Process services confidence scores
    profile.services.forEach((service, index) => {
      if (service.confidenceScore < 0.8 || service.requiresReview) {
        flags.push({ 
          field: `services[${index}]`, 
          issue: `Low confidence or explicit review requested for service: "${service.name}". Verify accuracy.`, 
          severity: 'medium' 
        });
      }
    });

    // Process FAQ confidence scores
    profile.faqs.forEach((faq, index) => {
      if (faq.confidenceScore < 0.7) {
        flags.push({
          field: `faqs[${index}]`,
          issue: `Low confidence FAQ extraction: "${faq.question}". This might be a hallucination or poor scrape.`,
          severity: 'low'
        });
      }
    });

    return flags;
  }
}
