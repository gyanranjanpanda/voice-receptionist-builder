import { AppointmentType } from '../../domain/value-objects/AppointmentType';
import { LocalDate } from '../../domain/value-objects/LocalDate';
import { TimeZone } from '../../domain/value-objects/TimeZone';
import { AppointmentSlot } from '../../domain/entities/AppointmentSlot';
// We reference the abstract BookingProvider Port (which will be implemented safely in Infrastructure layer)
import { BookingProvider } from '../../infrastructure/booking/BookingProvider';

export class CheckAvailability {
  constructor(private readonly bookingProvider: BookingProvider) {}

  public async execute(
    appointmentTypeName: string, 
    preferredDateStr: string, 
    timezoneId: string
  ): Promise<AppointmentSlot[]> {
    
    // Application enforces domain invariants immediately before sending network queries
    const apptType = new AppointmentType(appointmentTypeName);
    const date = new LocalDate(preferredDateStr);
    const tz = new TimeZone(timezoneId);

    // Call external gateway safely
    return await this.bookingProvider.getAvailableSlots(apptType, date, tz);
  }
}
