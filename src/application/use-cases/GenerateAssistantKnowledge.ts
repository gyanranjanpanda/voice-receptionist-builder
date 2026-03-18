import { BusinessProfile } from '../../shared/types/business';

export class GenerateAssistantKnowledge {
  /**
   * Generates a structural highly optimal system prompt based on the extracted business profile.
   */
  static execute(profile: BusinessProfile, tone: string = 'professional and friendly'): string {
    const servicesText = profile.services
      .map(s => `- ${s.name}: ${s.description || 'No description listed.'} ${s.price ? `(Price: ${s.price})` : ''}`)
      .join('\n');

    const faqsText = profile.faqs
      .map(f => `Q: ${f.question}\nA: ${f.answer}`)
      .join('\n\n');

    const hoursText = Object.entries(profile.openingHours)
      .map(([day, hours]) => `${day}: ${hours}`)
      .join('\n');

    return `You are the AI voice receptionist for ${profile.businessName}.
Your tone should be ${tone}.

Business Information:
---
Name: ${profile.businessName}
${profile.industry ? `Industry: ${profile.industry}` : ''}
Phone: ${profile.phone || 'Unknown'}
Email: ${profile.email || 'Unknown'}
Address: ${profile.address || 'Unknown'}

Opening Hours:
${hoursText}

Services Offered:
${servicesText}

Frequently Asked Questions:
${faqsText}

Booking Rules & Notes:
${(profile.bookingRules || []).join('\n')}

Emergency Handling:
${profile.emergencyHandling || 'Politely advise the caller that you cannot handle emergencies and they should call external emergency services or a dedicated human line immediately.'}
---

INSTRUCTIONS:
1. Greet the caller professionally.
2. Answer questions based ONLY on the provided Business Information. Do NOT make up services, opening hours, or prices.
3. If the caller asks about something outside this knowledge base, politely state that you don't have that information and offer to take a message or transfer them.
4. Collect the caller's name and intent before attempting to book or transfer.
5. If the caller has an emergency, follow the Emergency Handling instructions strictly.`;
  }
}
