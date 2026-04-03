export class AppointmentType {
  private readonly typeName: string;

  constructor(typeName: string) {
    if (!typeName || typeName.trim() === '') {
      throw new Error('AppointmentType cannot be empty');
    }
    
    // Normalize presentation to lowercase for deterministic mapping internally
    this.typeName = typeName.trim().toLowerCase();
  }

  public get(): string {
    return this.typeName;
  }

  public equals(other: AppointmentType): boolean {
    return this.typeName === other.get();
  }
}
