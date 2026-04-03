import { BookingProvider } from './BookingProvider';
import { AppointmentSlot } from '../../domain/entities/AppointmentSlot';
import { AppointmentType } from '../../domain/value-objects/AppointmentType';
import { LocalDate } from '../../domain/value-objects/LocalDate';
import { TimeZone } from '../../domain/value-objects/TimeZone';
import { AppointmentRequest } from '../../domain/entities/AppointmentRequest';
import { BookingConfirmation } from '../../domain/entities/BookingConfirmation';
import { DurationMinutes } from '../../domain/value-objects/DurationMinutes';
import { LocalDateTime } from '../../domain/value-objects/LocalDateTime';

/**
 * Deterministic Mock Adapter for safely testing end-to-end voice flows out-of-the-box
 * prior to plugging in physical Calendar integrations.
 */
export class MockBookingProvider implements BookingProvider {
  public async getAvailableSlots(type: AppointmentType, date: LocalDate, tz: TimeZone): Promise<AppointmentSlot[]> {
    // Generate deterministic 9:00 AM and 2:00 PM slots for testing bounds securely
    const baseDate = date.get();
    
    const slot1 = new AppointmentSlot(
      'dr-mock', 
      new LocalDateTime(`${baseDate}T09:00:00Z`), 
      new DurationMinutes(30), 
      'available'
    );
    
    const slot2 = new AppointmentSlot(
      'dr-mock', 
      new LocalDateTime(`${baseDate}T14:00:00Z`), 
      new DurationMinutes(30), 
      'available'
    );
    
    return [slot1, slot2];
  }

  public async holdSlot(slot: AppointmentSlot, type: AppointmentType): Promise<boolean> {
    console.log(`[MockProvider] Held slot temporarily at ${slot.startTime.get()}`);
    return true;
  }

  public async confirmBooking(request: AppointmentRequest): Promise<BookingConfirmation> {
    console.log(`[MockProvider] Successfully Confirmed booking for ${request.customerName}`);
    
    return new BookingConfirmation(
      `mock-bk-${Date.now()}`,
      request.requestedSlot,
      request.requestedSlot.providerId,
      "Mock Dental Clinic - Consultation Room 1",
      "Please arrive 10 minutes early to fill out mock forms."
    );
  }

  public async cancelBooking(bookingId: string): Promise<boolean> {
    console.log(`[MockProvider] Cancelled tracking link ID ${bookingId}`);
    return true;
  }

  public async captureLead(name: string, phone: string, reason: string): Promise<void> {
    console.log(`[MockProvider] Escrowed lead: ${name} (${phone}) - Reason Details: ${reason}`);
  }
}
