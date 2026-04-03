export class TimeZone {
  private readonly identifier: string;

  constructor(identifier: string) {
    if (!identifier || identifier.trim() === '') {
      throw new Error('TimeZone identifier cannot be empty');
    }

    const trimmed = identifier.trim();

    // Domain rule: Must be a valid IANA time zone identifier
    try {
      Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    } catch (e) {
      throw new Error(`Invalid IANA time zone identifier: ${trimmed}`);
    }

    this.identifier = trimmed;
  }

  public get(): string {
    return this.identifier;
  }

  public equals(other: TimeZone): boolean {
    return this.identifier === other.get();
  }
}
