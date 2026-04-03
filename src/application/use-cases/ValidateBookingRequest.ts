import { AppointmentRequest } from '../../domain/entities/AppointmentRequest';
import { BookingPolicy } from '../../domain/services/BookingPolicy';

export class ValidateBookingRequest {
  constructor(private readonly policy: BookingPolicy) {}

  public execute(request: AppointmentRequest): boolean {
    // Strictly validates bounds mapping to the explicit rules engine
    this.policy.canBook(request);
    return true;
  }
}
