import { AppointmentRequest } from '../../domain/entities/AppointmentRequest';
import { BookingConfirmation } from '../../domain/entities/BookingConfirmation';
import { CancelAppointment } from './CancelAppointment';
import { ConfirmAppointmentBooking } from './ConfirmAppointmentBooking';

export class RescheduleAppointment {
  constructor(
    private readonly cancelUseCase: CancelAppointment,
    private readonly confirmUseCase: ConfirmAppointmentBooking
  ) {}

  public async execute(existingBookingId: string, newRequest: AppointmentRequest): Promise<BookingConfirmation> {
    // 1. Enforce transactional workflow by cancelling the old reservation cleanly
    await this.cancelUseCase.execute(existingBookingId);
    
    // 2. Validate and execute the new request tracking policies
    return await this.confirmUseCase.execute(newRequest);
  }
}
