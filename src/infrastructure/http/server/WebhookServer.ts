import express, { Request, Response } from 'express';
import path from 'path';
import { VapiWebhookVerifier } from '../../vapi/VapiWebhookVerifier';
import { CheckAvailability } from '../../../application/use-cases/CheckAvailability';
import { ConfirmAppointmentBooking } from '../../../application/use-cases/ConfirmAppointmentBooking';
import { GenerateVoiceResponseFromToolResult } from '../../../application/use-cases/GenerateVoiceResponseFromToolResult';
import { InMemoryCallLog } from '../../persistence/InMemoryCallLog';
import { BookedAppointment } from '../../../domain/entities/CallEvent';

export class WebhookServer {
  public readonly app = express();
  private readonly callLog = new InMemoryCallLog();

  constructor(
    private readonly verifier: VapiWebhookVerifier,
    private readonly checkAvailability: CheckAvailability,
    private readonly confirmBooking: ConfirmAppointmentBooking,
    private readonly responseGenerator: GenerateVoiceResponseFromToolResult
  ) {
    this.app.use(express.json());
    this.serveSPA();
    this.registerRoutes();
  }

  /**
   * Serve the production SPA from the public directory.
   * Static assets are served first — API routes take precedence via explicit registration.
   */
  private serveSPA(): void {
    const publicDir = path.resolve(__dirname, '../../../interfaces/http/public');
    this.app.use(express.static(publicDir));
  }

  private registerRoutes(): void {
    this.app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

    // SPA root — serve index.html for the main UI
    this.app.get('/', (_req, res) => {
      const publicDir = path.resolve(__dirname, '../../../interfaces/http/public');
      res.sendFile(path.join(publicDir, 'index.html'));
    });

    // Legacy demo routes — redirect to the new SPA
    this.app.get('/demo', (_req, res) => res.redirect('/'));
    this.app.get('/demo2', (_req, res) => res.redirect('/'));

    // Admin API — call history
    this.app.get('/api/calls', (_req, res) => {
      res.json({ calls: this.callLog.getAllCalls() });
    });

    // Admin API — booked appointments
    this.app.get('/api/appointments', (_req, res) => {
      res.json({ appointments: this.callLog.getAllAppointments() });
    });

    // Admin API — captured leads
    this.app.get('/api/leads', (_req, res) => {
      res.json({ leads: this.callLog.getAllLeads() });
    });

    // Admin API — stats overview
    this.app.get('/api/stats', (_req, res) => {
      res.json(this.callLog.getStats());
    });

    // Vapi Webhook — main tool-call handler
    this.app.post('/api/vapi-webhook', this.verifier.verifySignature, async (req: Request, res: Response) => {
      try {
        const message = req.body?.message;
        if (message?.type !== 'tool-calls') {
          return res.status(400).json({ error: 'Unsupported message type' });
        }

        const toolCall = message.toolCalls[0];
        const functionName = toolCall?.function?.name;
        const args = toolCall?.function?.arguments || {};

        let toolResult: unknown;

        switch (functionName) {
          case 'check_availability':
            toolResult = await this.handleCheckAvailability(args);
            break;

          case 'book_appointment':
            toolResult = await this.handleBookAppointment(args);
            break;

          case 'capture_caller_info':
            toolResult = this.handleCaptureCallerInfo(args);
            break;

          default:
            toolResult = { error: `Unknown action: ${functionName}` };
        }

        const spokenResponse = this.responseGenerator.execute(
          functionName,
          toolResult as Record<string, unknown>
        );

        return res.json({
          results: [{
            toolCallId: toolCall.id,
            result: spokenResponse,
          }],
        });

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[Webhook] Error processing tool call: ${errorMessage}`);

        // Return a spoken fallback instead of a raw error — the caller should never hear a stack trace
        return res.json({
          results: [{
            toolCallId: req.body?.message?.toolCalls?.[0]?.id || 'unknown',
            result: "I'm sorry, I'm having a bit of trouble with that. Let me connect you to our front desk so they can help.",
          }],
        });
      }
    });
  }

  private async handleCheckAvailability(
    args: Record<string, string>
  ): Promise<unknown> {
    return this.checkAvailability.execute(
      args.appointmentType || 'general',
      args.preferredDate || new Date().toISOString().split('T')[0],
      args.timezone || 'America/New_York'
    );
  }

  private async handleBookAppointment(
    args: Record<string, string>
  ): Promise<BookedAppointment> {
    const appointment: BookedAppointment = {
      id: `bk-${Date.now()}`,
      service: args.service || 'General appointment',
      date: args.date || '',
      time: args.time || '',
      patientName: args.patientName || 'Unknown',
      patientPhone: args.patientPhone || '',
      bookedAt: new Date().toISOString(),
    };

    this.callLog.addAppointment(appointment);
    return appointment;
  }

  private handleCaptureCallerInfo(
    args: Record<string, string>
  ): { captured: boolean } {
    this.callLog.addLead({
      name: args.name || 'Unknown',
      phone: args.phone || '',
      reason: args.reason || 'No reason provided',
      capturedAt: new Date().toISOString(),
    });

    return { captured: true };
  }

  public listen(port: number): void {
    this.app.listen(port, () => {
      console.log(`[Server] Voice Receptionist running on http://localhost:${port}`);
    });
  }
}
