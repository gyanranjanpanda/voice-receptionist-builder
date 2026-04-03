import { BusinessHours } from '../../domain/value-objects/BusinessHours';
import { BookingPolicy } from '../../domain/services/BookingPolicy';

/**
 * Translates raw database/config strings into strict Domain Booking Policies dynamically.
 */
export class MapBusinessRulesToBookingPolicy {
  public execute(rawConfig: any): BookingPolicy {
    const hours = new BusinessHours(
      rawConfig.openTime || "09:00",
      rawConfig.closeTime || "17:00"
    );
    
    return new BookingPolicy(
      hours,
      rawConfig.maxDaysIntoFuture || 30,
      rawConfig.minimumNoticeHours || 24
    );
  }
}
