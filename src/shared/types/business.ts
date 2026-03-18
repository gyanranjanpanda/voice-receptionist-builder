import { z } from 'zod';

export const ServiceOfferingSchema = z.object({
  name: z.string().describe('Name of the service offered'),
  description: z.string().optional().describe('Details about the service'),
  price: z.string().optional().describe('Extracted pricing details if available'),
  confidenceScore: z.number().min(0).max(1).describe('Confidence [0-1] in the accuracy of extraction'),
  requiresReview: z.boolean().describe('True if the LLM is unsure and requests human review')
});

export const FAQItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
  sourcePage: z.string().optional(),
  confidenceScore: z.number().min(0).max(1)
});

export const OpeningHoursSchema = z.record(
  z.string(), // Day of week
  z.string()  // Hours
).describe('Mapping of day of week to opening hours, e.g., { Monday: "9am - 5pm" }');

export const BusinessProfileSchema = z.object({
  businessName: z.string(),
  industry: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  services: z.array(ServiceOfferingSchema),
  openingHours: OpeningHoursSchema,
  faqs: z.array(FAQItemSchema),
  bookingRules: z.array(z.string()).optional().describe('Inferred rules about booking appointments'),
  emergencyHandling: z.string().optional().describe('Instructions for emergency or out-of-hours calls')
});

export type ServiceOffering = z.infer<typeof ServiceOfferingSchema>;
export type FAQItem = z.infer<typeof FAQItemSchema>;
export type OpeningHours = z.infer<typeof OpeningHoursSchema>;
export type BusinessProfile = z.infer<typeof BusinessProfileSchema>;
