import { LocalDateTime } from '../value-objects/LocalDateTime';
import { DurationMinutes } from '../value-objects/DurationMinutes';

export type SlotStatus = 'available' | 'held' | 'booked';

export class AppointmentSlot {
  constructor(
    public readonly providerId: string,
    public readonly startTime: LocalDateTime,
    public readonly duration: DurationMinutes,
    public readonly status: SlotStatus
  ) {
    if (!providerId || providerId.trim() === '') {
      throw new Error('AppointmentSlot requires a valid providerId to bind to an external calendar');
    }
  }
}
