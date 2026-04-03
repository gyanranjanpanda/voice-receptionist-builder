import { PhoneNumber } from '../../domain/value-objects/PhoneNumber';

export class CaptureCallerDetails {
  public execute(rawName: string, rawPhone: string, email?: string): { name: string, phone: PhoneNumber, email?: string } {
    if (!rawName || rawName.trim() === '') {
      throw new Error('Caller name is strictly required to capture a lead profile.');
    }

    // Pass the raw string to the Domain Value Object to filter PII attacks or invalid shapes immediately
    const sanitizedPhone = new PhoneNumber(rawPhone);

    return {
      name: rawName.trim(),
      phone: sanitizedPhone,
      email: email?.trim()
    };
  }
}
