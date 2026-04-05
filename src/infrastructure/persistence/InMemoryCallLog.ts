import { CallEvent, BookedAppointment, CapturedLead } from '../../domain/entities/CallEvent';

/**
 * In-memory persistence adapter for call logs, appointments, and captured leads.
 * Swap with a database-backed adapter (Postgres, Mongo) for production use.
 */
export class InMemoryCallLog {
  private readonly calls: CallEvent[] = [];
  private readonly appointments: BookedAppointment[] = [];
  private readonly leads: CapturedLead[] = [];

  public logCall(call: CallEvent): void {
    this.calls.push(call);
  }

  public findCallById(callId: string): CallEvent | undefined {
    return this.calls.find(c => c.id === callId);
  }

  public addAppointment(appointment: BookedAppointment): void {
    this.appointments.push(appointment);
  }

  public addLead(lead: CapturedLead): void {
    this.leads.push(lead);
  }

  public getAllCalls(): Record<string, unknown>[] {
    return this.calls.map(c => c.toJSON());
  }

  public getAllAppointments(): BookedAppointment[] {
    return [...this.appointments];
  }

  public getAllLeads(): CapturedLead[] {
    return [...this.leads];
  }

  public getStats(): { totalCalls: number; totalAppointments: number; totalLeads: number } {
    return {
      totalCalls: this.calls.length,
      totalAppointments: this.appointments.length,
      totalLeads: this.leads.length,
    };
  }
}
