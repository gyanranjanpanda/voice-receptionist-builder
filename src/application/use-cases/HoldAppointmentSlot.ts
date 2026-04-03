import { AppointmentSlot } from '../../domain/entities/AppointmentSlot';
import { AppointmentType } from '../../domain/value-objects/AppointmentType';
import { BookingProvider } from '../../infrastructure/booking/BookingProvider';

/**
 * Handles the critical "Slot Hold" protocol to prevent fast booking Race Conditions.
 * Ensures an AI receptionist holds a slot while collecting customer detail strings.
 */
export class HoldAppointmentSlot {
  constructor(private readonly bookingProvider: BookingProvider) {}

  public async execute(slot: AppointmentSlot, type: AppointmentType): Promise<boolean> {
    // Escalate to Provider
    const success = await this.bookingProvider.holdSlot(slot, type);
    
    // The slot hold might timeout naturally inside the CRM / Calendar depending on Provider bounds
    return success;
  }
}
