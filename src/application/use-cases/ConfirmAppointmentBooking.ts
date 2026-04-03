import { AppointmentRequest } from '../../domain/entities/AppointmentRequest';
import { BookingConfirmation } from '../../domain/entities/BookingConfirmation';
import { BookingPolicy } from '../../domain/services/BookingPolicy';
import { BookingProvider } from '../../infrastructure/booking/BookingProvider';

export class ConfirmAppointmentBooking {
  constructor(
    private readonly provider: BookingProvider,
    private readonly bookingPolicy: BookingPolicy
  ) {}

  public async execute(request: AppointmentRequest): Promise<BookingConfirmation> {
    // 1. Enforce Domain booking policy engine (office hours, limits) before executing externally
    this.bookingPolicy.canBook(request);
    
    // 2. Delegate the physical system confirmation strictly to the normalized Infrastructure adapter
    return await this.provider.confirmBooking(request);
  }
}
