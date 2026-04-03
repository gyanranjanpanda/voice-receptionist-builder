export class DurationMinutes {
  private readonly minutes: number;

  constructor(minutes: number) {
    if (!Number.isInteger(minutes)) {
      throw new Error(`Invalid duration: ${minutes}. Must be an integer.`);
    }
    
    // Domain rule: Cannot have zero or negative durations for appointments
    if (minutes <= 0) {
      throw new Error(`Invalid duration: ${minutes}. Must be strictly positive.`);
    }

    // Domain rule: Arbitrary upper bound to prevent erroneous 10-day bookings
    if (minutes > 1440) {
      throw new Error(`Invalid duration: ${minutes}. Cannot exceed 24 hours (1440m).`);
    }

    this.minutes = minutes;
  }

  public get(): number {
    return this.minutes;
  }
}
