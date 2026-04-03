import { BookingProvider } from '../../infrastructure/booking/BookingProvider';

export class CancelAppointment {
  constructor(private readonly provider: BookingProvider) {}

  public async execute(bookingId: string): Promise<boolean> {
    if (!bookingId || bookingId.trim() === '') {
      throw new Error('Booking ID string is strictly required to execute a cancellation protocol');
    }
    
    // Pass execution securely to the adapter port
    return await this.provider.cancelBooking(bookingId);
  }
}
