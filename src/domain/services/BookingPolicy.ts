import { AppointmentRequest } from '../entities/AppointmentRequest';
import { AppointmentSlot } from '../entities/AppointmentSlot';
import { BusinessHours } from '../value-objects/BusinessHours';

export class BookingPolicy {
  constructor(
    private readonly businessHours: BusinessHours,
    private readonly maxDaysIntoFuture: number,
    private readonly minimumNoticeHours: number
  ) {
    if (maxDaysIntoFuture <= 0) throw new Error('Maximum days into future must be strictly positive');
    if (minimumNoticeHours < 0) throw new Error('Minimum notice hours cannot be negative');
  }

  public validateSlot(slot: AppointmentSlot): void {
    const isoTime = slot.startTime.get();
    const dateObj = new Date(isoTime);
    
    // Minimal heuristic for extracting the explicit 24h clock for operational hour comparison
    const hours = dateObj.getUTCHours().toString().padStart(2, '0');
    const minutes = dateObj.getUTCMinutes().toString().padStart(2, '0');
    const time24h = `${hours}:${minutes}`;

    if (!this.businessHours.isWithin(time24h)) {
      throw new Error(`Slot time ${time24h} formally violates constrained Business Hours.`);
    }

    const hoursFromNow = (dateObj.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursFromNow < this.minimumNoticeHours) {
      throw new Error(`Slot violates minimum notice operational policy of ${this.minimumNoticeHours} hours.`);
    }

    const daysFromNow = hoursFromNow / 24;
    if (daysFromNow > this.maxDaysIntoFuture) {
      throw new Error(`Slot exceeds maximum allowed booking window of ${this.maxDaysIntoFuture} days.`);
    }
  }

  public canBook(request: AppointmentRequest): boolean {
    this.validateSlot(request.requestedSlot);
    // Immutability mappings: Further granular rules bound defensively inside Value Objects (Phone, Typings) 
    return true;
  }
}
