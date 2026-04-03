import { AppointmentSlot } from './AppointmentSlot';

export class BookingConfirmation {
  constructor(
    public readonly externalBookingId: string,
    public readonly confirmedSlot: AppointmentSlot,
    public readonly providerName: string,
    public readonly locationDetails: string,
    public readonly instructions?: string
  ) {
    if (!externalBookingId || externalBookingId.trim() === '') {
      throw new Error('BookingConfirmation requires a valid external tracking ID from the booking provider/CRM');
    }
  }
}
