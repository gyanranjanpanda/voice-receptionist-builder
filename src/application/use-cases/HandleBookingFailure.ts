import { BookingProvider } from '../../infrastructure/booking/BookingProvider';

/**
 * Ensures high reliability by gracefully handling catastrophic external booking failures
 * or domain rejection bounds during a live Vapi call without dropping the caller context.
 */
export class HandleBookingFailure {
  constructor(private readonly provider: BookingProvider) {}

  public async execute(name: string, phone: string, failureDetails: string): Promise<string> {
    try {
      // Degrade gracefully into a CRM lead so staff can do a manual callback
      await this.provider.captureLead(name, phone, failureDetails);
      return "I'm having trouble securing that specific slot right now, but I have flagged your details for our front desk. A staff member will call you shortly to finish booking.";
    } catch (infrastructureError) {
      // Total failure
      return "Our booking system is currently undergoing maintenance. Please try calling back later during normal business hours.";
    }
  }
}
