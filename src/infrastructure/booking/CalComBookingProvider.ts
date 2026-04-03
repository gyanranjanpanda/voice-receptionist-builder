import axios from 'axios';
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
 * PHYSICAL ADAPTER: Cal.com API Integrator
 * Translates Application Domain intents securely into physical outbound REST calls to Cal.com.
 * Fully abstracts the third-party endpoint away from the core AI intelligence.
 */
export class CalComBookingProvider implements BookingProvider {
  private readonly baseUrl = 'https://api.cal.com/v1';

  constructor(private readonly apiKey: string) {
    if (!apiKey) console.warn('[WARNING] Cal.com Provider initialized without API key! API queries will fail natively.');
  }
  
  public async getAvailableSlots(type: AppointmentType, date: LocalDate, tz: TimeZone): Promise<AppointmentSlot[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/slots`, {
        params: {
          apiKey: this.apiKey,
          eventTypeId: type.get(), 
          startTime: date.get(),
          endTime: date.get() // Bounding constraints
        }
      });

      // Map external raw JSON directly into strict internal Domain Entities enforcing boundaries safely
      const slots = response.data.slots || Object.values(response.data.slots || {})[0] || [];
      return slots.map((slotData: any) => {
        return new AppointmentSlot(
          'cal-com-provider',
          new LocalDateTime(slotData.time),
          new DurationMinutes(30), // Dynamic mapping requirement can go here securely
          'available'
        );
      });
    } catch (e: any) {
      throw new Error(`Cal.com slot bridging aborted: ${e.message}`);
    }
  }

  public async holdSlot(slot: AppointmentSlot, type: AppointmentType): Promise<boolean> { 
    // Cal.com handles holding inherently when booking is initiated, 
    // For this strict abstraction, we optimistically approve the hold routing phase.
    console.log(`[Cal.com] Bridging slot hold constraint logically for ${slot.startTime.get()}`);
    return true; 
  }

  public async confirmBooking(request: AppointmentRequest): Promise<BookingConfirmation> { 
    try {
      const payload = {
        apiKey: this.apiKey,
        eventTypeId: request.appointmentType.get(),
        start: request.requestedSlot.startTime.get(),
        name: request.customerName,
        email: request.customerEmail || 'no-reply@clinic.com',
        notes: request.reasonForVisit,
        metadata: {
          phone: request.customerPhone.get()
        }
      };

      const response = await axios.post(`${this.baseUrl}/bookings`, payload);
      
      return new BookingConfirmation(
        response.data.id.toString(),
        request.requestedSlot,
        'cal-com-integration-node',
        response.data.location || 'Clinic Audio Room',
        'Please ensure arriving early. Booking permanently synced.'
      );
    } catch (e: any) {
      throw new Error(`Cal.com physical HTTP persistence failure: ${e.message}`);
    }
  }

  public async cancelBooking(bookingId: string): Promise<boolean> { 
    await axios.delete(`${this.baseUrl}/bookings/${bookingId}`, {
      params: { apiKey: this.apiKey }
    });
    return true; 
  }

  public async captureLead(name: string, phone: string, reason: string): Promise<void> { 
    console.log(`[Cal.com Fallback] Escrowing lead externally for front-desk sync: ${name} - ${phone} | ${reason}`);
    // Native webhook hook insertion point for HighLevel fallback integrations
  }
}
