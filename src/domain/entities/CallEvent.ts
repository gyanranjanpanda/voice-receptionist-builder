export type CallStatus = 'in-progress' | 'completed' | 'missed' | 'dropped';

export interface BookedAppointment {
  id: string;
  service: string;
  date: string;
  time: string;
  patientName: string;
  patientPhone: string;
  bookedAt: string;
}

export interface CapturedLead {
  name: string;
  phone: string;
  reason: string;
  capturedAt: string;
}

export class CallEvent {
  public endedAt?: string;
  public duration?: number;
  public appointmentBooked: boolean = false;

  constructor(
    public readonly id: string,
    public readonly startedAt: string,
    public status: CallStatus
  ) {
    if (!id || id.trim() === '') {
      throw new Error('CallEvent requires a unique identifier');
    }
  }

  public complete(): void {
    this.status = 'completed';
    this.endedAt = new Date().toISOString();
    if (this.startedAt) {
      this.duration = Math.round(
        (new Date(this.endedAt).getTime() - new Date(this.startedAt).getTime()) / 1000
      );
    }
  }

  public markDropped(): void {
    this.status = 'dropped';
    this.endedAt = new Date().toISOString();
  }

  public markAppointmentBooked(): void {
    this.appointmentBooked = true;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      duration: this.duration,
      status: this.status,
      appointmentBooked: this.appointmentBooked,
    };
  }
}
