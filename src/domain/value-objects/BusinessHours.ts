export class BusinessHours {
  constructor(
    public readonly openTime24h: string, 
    public readonly closeTime24h: string
  ) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    
    if (!timeRegex.test(openTime24h) || !timeRegex.test(closeTime24h)) {
      throw new Error('Invalid BusinessHours formatting. Expected HH:MM in strict 24h format.');
    }
    
    if (openTime24h >= closeTime24h) {
      throw new Error(`Business open time (${openTime24h}) must mathematically precede close time (${closeTime24h})`);
    }
  }

  public isWithin(time24h: string): boolean {
    return time24h >= this.openTime24h && time24h <= this.closeTime24h;
  }
}
