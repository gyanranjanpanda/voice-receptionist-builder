export class LocalDateTime {
  private readonly isoString: string;

  constructor(isoDateTimeString: string) {
    if (!isoDateTimeString) throw new Error('LocalDateTime cannot be empty');
    
    // Domain rule: Must aggressively resolve to a valid chronometric point
    const date = new Date(isoDateTimeString);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid ISO-8601 date-time string: ${isoDateTimeString}`);
    }
    
    this.isoString = date.toISOString();
  }

  public get(): string {
    return this.isoString;
  }
}
