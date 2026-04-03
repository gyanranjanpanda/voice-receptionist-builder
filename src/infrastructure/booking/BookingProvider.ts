import { AppointmentSlot } from '../../domain/entities/AppointmentSlot';
import { AppointmentType } from '../../domain/value-objects/AppointmentType';
import { LocalDate } from '../../domain/value-objects/LocalDate';
import { TimeZone } from '../../domain/value-objects/TimeZone';
import { AppointmentRequest } from '../../domain/entities/AppointmentRequest';
import { BookingConfirmation } from '../../domain/entities/BookingConfirmation';

/**
 * The Infrastructure Port (Interface) dictated by the Application Layer.
 * External CRM APIs (Cal.com, GoHighLevel) will implement this contract.
 */
export interface BookingProvider {
  getAvailableSlots(type: AppointmentType, date: LocalDate, tz: TimeZone): Promise<AppointmentSlot[]>;
  holdSlot(slot: AppointmentSlot, type: AppointmentType): Promise<boolean>;
  confirmBooking(request: AppointmentRequest): Promise<BookingConfirmation>;
  cancelBooking(bookingId: string): Promise<boolean>;
  captureLead(name: string, phone: string, reason: string): Promise<void>;
}
