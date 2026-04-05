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
 * Deterministic mock adapter for testing voice flows without a live calendar integration.
 * Returns realistic dental-office slots that vary by appointment type.
 */
export class MockBookingProvider implements BookingProvider {

  private static readonly SLOT_TEMPLATES: Record<string, string[]> = {
    default:    ['09:00', '10:30', '13:00', '14:30', '16:00'],
    cleaning:   ['09:00', '10:00', '11:00', '14:00', '15:00'],
    checkup:    ['09:00', '10:30', '14:00', '15:30'],
    filling:    ['10:00', '13:00', '15:00'],
    whitening:  ['09:00', '13:00'],
    emergency:  ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'],
  };

  private static readonly DURATION_MAP: Record<string, number> = {
    cleaning:  45,
    checkup:   30,
    filling:   60,
    whitening: 90,
    emergency: 30,
    default:   30,
  };

  public async getAvailableSlots(
    type: AppointmentType,
    date: LocalDate,
    tz: TimeZone
  ): Promise<AppointmentSlot[]> {
    const baseDate = date.get();
    const typeName = type.get();
    const templates = MockBookingProvider.SLOT_TEMPLATES[typeName]
      || MockBookingProvider.SLOT_TEMPLATES.default;
    const duration = MockBookingProvider.DURATION_MAP[typeName]
      || MockBookingProvider.DURATION_MAP.default;

    // Simulate reduced availability — drop a few slots based on date hash
    const dateHash = baseDate.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);
    const availableTemplates = templates.filter((_, idx) => (dateHash + idx) % 3 !== 0);

    if (availableTemplates.length === 0) {
      return [this.buildSlot(baseDate, templates[0], duration)];
    }

    return availableTemplates.map(time => this.buildSlot(baseDate, time, duration));
  }

  public async holdSlot(slot: AppointmentSlot, _type: AppointmentType): Promise<boolean> {
    return true;
  }

  public async confirmBooking(request: AppointmentRequest): Promise<BookingConfirmation> {
    return new BookingConfirmation(
      `bk-${Date.now()}`,
      request.requestedSlot,
      request.requestedSlot.providerId,
      'Bright Smile Dental — Room 2',
      'Please arrive 10 minutes early. Bring your insurance card if applicable.'
    );
  }

  public async cancelBooking(_bookingId: string): Promise<boolean> {
    return true;
  }

  public async captureLead(name: string, phone: string, reason: string): Promise<void> {
    // In production this would persist to a CRM or database
    console.log(`[Lead captured] ${name} (${phone}) — ${reason}`);
  }

  private buildSlot(dateStr: string, time: string, durationMins: number): AppointmentSlot {
    return new AppointmentSlot(
      'dr-bright',
      new LocalDateTime(`${dateStr}T${time}:00Z`),
      new DurationMinutes(durationMins),
      'available'
    );
  }
}
