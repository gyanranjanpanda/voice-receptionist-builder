export class PhoneNumber {
  private readonly value: string;

  constructor(value: string) {
    if (!value) throw new Error('Phone number cannot be empty');
    
    // Normalize string by stripping everything except digits and the plus symbol
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // Domain rule: Must look like a valid international or regional phone number
    if (cleaned.length < 10 || cleaned.length > 15) {
      throw new Error(`Invalid phone number length: ${value}. Must be between 10 and 15 digits.`);
    }

    this.value = cleaned;
  }

  public get(): string {
    return this.value;
  }

  public equals(other: PhoneNumber): boolean {
    return this.value === other.get();
  }
}
