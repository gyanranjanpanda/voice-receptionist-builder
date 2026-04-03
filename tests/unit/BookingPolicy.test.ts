import { BookingPolicy } from '../../src/domain/services/BookingPolicy';
import { BusinessHours } from '../../src/domain/value-objects/BusinessHours';
import { AppointmentSlot } from '../../src/domain/entities/AppointmentSlot';
import { LocalDateTime } from '../../src/domain/value-objects/LocalDateTime';
import { DurationMinutes } from '../../src/domain/value-objects/DurationMinutes';

describe('BookingPolicy strict Application Rules', () => {
  it('instantly rejects any slot generated outside strictly defined business hours', () => {
    const defaultHours = new BusinessHours("09:00", "17:00");
    const policy = new BookingPolicy(defaultHours, 30, 24);
    
    const lateSlot = new AppointmentSlot(
      'dr-mock',
      new LocalDateTime(`2026-03-20T18:30:00Z`), // Evaluates after 17:00
      new DurationMinutes(30),
      'available'
    );

    expect(() => policy.validateSlot(lateSlot)).toThrow(/violates constrained Business Hours/);
  });
  
  it('throws Error if slot exceeds max future horizon', () => {
    const hours = new BusinessHours("09:00", "17:00");
    const policy = new BookingPolicy(hours, 7, 24); // 7 days max
    
    // Simulating a highly distant slot request (Year 2027)
    const farSlot = new AppointmentSlot(
      'dr-mock',
      new LocalDateTime(`2027-03-20T10:00:00Z`),
      new DurationMinutes(30),
      'available'
    );

    expect(() => policy.validateSlot(farSlot)).toThrow(/exceeds maximum allowed booking window/);
  });
});
