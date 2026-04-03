export class LocalDate {
  private readonly dateString: string;

  /**
   * Represents a strict YYYY-MM-DD date without time or timezone coupling.
   */
  constructor(dateString: string) {
    if (!dateString) throw new Error('LocalDate cannot be empty');

    // Domain rule: Exact ISO Date boundary checks
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString.trim())) {
      throw new Error(`Invalid LocalDate format. Expected YYYY-MM-DD, got ${dateString}`);
    }

    const date = new Date(dateString.trim());
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid chronological date value: ${dateString}`);
    }

    this.dateString = dateString.trim();
  }

  public get(): string {
    return this.dateString;
  }
}
