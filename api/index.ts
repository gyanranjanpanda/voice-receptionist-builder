import { WebhookServer } from '../src/infrastructure/http/server/WebhookServer';
import { VapiWebhookVerifier } from '../src/infrastructure/vapi/VapiWebhookVerifier';
import { CheckAvailability } from '../src/application/use-cases/CheckAvailability';
import { ConfirmAppointmentBooking } from '../src/application/use-cases/ConfirmAppointmentBooking';
import { GenerateVoiceResponseFromToolResult } from '../src/application/use-cases/GenerateVoiceResponseFromToolResult';
import { MockBookingProvider } from '../src/infrastructure/booking/MockBookingProvider';
import { BookingPolicy } from '../src/domain/services/BookingPolicy';
import { BusinessHours } from '../src/domain/value-objects/BusinessHours';

// Vercel Serverless Function entry point
const provider = new MockBookingProvider();
const policy = new BookingPolicy(new BusinessHours("09:00", "17:00"), 30, 24);
const verifier = new VapiWebhookVerifier(process.env.VAPI_WEBHOOK_SECRET || '');
const checkAvailability = new CheckAvailability(provider);
const confirmBooking = new ConfirmAppointmentBooking(provider, policy);
const responseGenerator = new GenerateVoiceResponseFromToolResult();

const server = new WebhookServer(verifier, checkAvailability, confirmBooking, responseGenerator);

// Export the express app for Vercel
export default server.app;
