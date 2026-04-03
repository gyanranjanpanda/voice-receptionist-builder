import { TimeZone } from '../../src/domain/value-objects/TimeZone';
import { PhoneNumber } from '../../src/domain/value-objects/PhoneNumber';

describe('Domain Value Objects validation safety bounds', () => {
  describe('TimeZone', () => {
    it('accepts strictly valid string identifiers corresponding to IANA regions', () => {
      expect(new TimeZone('America/New_York').get()).toBe('America/New_York');
      expect(new TimeZone('Europe/London').get()).toBe('Europe/London');
    });

    it('rejects garbage strings and triggers strict Domain exceptions natively', () => {
      expect(() => new TimeZone('Fake/Zone')).toThrow(/Invalid IANA time zone identifier/);
    });
  });
  
  describe('PhoneNumber', () => {
    it('strips all foreign characters and preserves strict numeral bounds', () => {
      expect(new PhoneNumber('(555) 123-4567').get()).toBe('5551234567');
      expect(new PhoneNumber('+1-800-555-0199 ext. 234').get()).toBe('+18005550199234');
    });

    it('throws Error securely if length is impossibly short or explicitly malicious', () => {
      expect(() => new PhoneNumber('123')).toThrow(/Invalid phone number length/);
    });
  });
});
