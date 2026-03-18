import { ConfidenceValidator } from '../../src/domain/services/ConfidenceValidator';
import { BusinessProfile } from '../../src/shared/types/business';

describe('ConfidenceValidator', () => {
  it('should return high severity flags for missing contact info', () => {
    const dummyProfile: BusinessProfile = {
      businessName: 'Test Clinic',
      services: [],
      openingHours: {},
      faqs: [],
    };

    const flags = ConfidenceValidator.validateProfile(dummyProfile);
    
    const contactFlag = flags.find(f => f.field === 'contact');
    expect(contactFlag).toBeDefined();
    expect(contactFlag?.severity).toBe('high');
    
    const hoursFlag = flags.find(f => f.field === 'openingHours');
    expect(hoursFlag).toBeDefined();
    expect(hoursFlag?.severity).toBe('high');
  });

  it('should not return contact flags if phone is provided', () => {
    const dummyProfile: BusinessProfile = {
      businessName: 'Test Clinic',
      phone: '123-456-7890',
      services: [],
      openingHours: { 'Monday': '9am-5pm' },
      faqs: [],
    };

    const flags = ConfidenceValidator.validateProfile(dummyProfile);
    
    const contactFlag = flags.find(f => f.field === 'contact');
    expect(contactFlag).toBeUndefined();
  });
});
