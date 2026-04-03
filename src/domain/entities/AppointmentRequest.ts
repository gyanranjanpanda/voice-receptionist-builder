import { AppointmentType } from '../value-objects/AppointmentType';
import { PhoneNumber } from '../value-objects/PhoneNumber';
import { AppointmentSlot } from './AppointmentSlot';

export class AppointmentRequest {
  constructor(
    public readonly customerName: string,
    public readonly customerPhone: PhoneNumber,
    public readonly appointmentType: AppointmentType,
    public readonly requestedSlot: AppointmentSlot,
    public readonly customerEmail?: string,
    public readonly reasonForVisit?: string
  ) {
    if (!customerName || customerName.trim().length === 0) {
      throw new Error('Customer full name is strictly required to bind a booking request');
    }
    
    if (requestedSlot.status !== 'available' && requestedSlot.status !== 'held') {
      throw new Error(`Cannot request a slot that is currently marked as ${requestedSlot.status}`);
    }
  }
}
