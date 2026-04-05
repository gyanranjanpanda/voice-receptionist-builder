import express, { Request, Response } from 'express';
import { VapiWebhookVerifier } from '../../vapi/VapiWebhookVerifier';
import { CheckAvailability } from '../../../application/use-cases/CheckAvailability';
import { ConfirmAppointmentBooking } from '../../../application/use-cases/ConfirmAppointmentBooking';
import { GenerateVoiceResponseFromToolResult } from '../../../application/use-cases/GenerateVoiceResponseFromToolResult';

export class WebhookServer {
  public readonly app = express();

  constructor(
    private readonly verifier: VapiWebhookVerifier,
    private readonly checkAvailability: CheckAvailability,
    private readonly confirmBooking: ConfirmAppointmentBooking,
    private readonly responseGenerator: GenerateVoiceResponseFromToolResult
  ) {
    this.app.use(express.json());
    this.registerRoutes();
  }

  private registerRoutes() {
    // Standard Observability hook
    this.app.get('/health', (req, res) => res.status(200).send('OK'));
    
    // Friendly root route
    this.app.get('/', (req, res) => res.status(200).send('Voice Receptionist Webhook Server is running securely! 🚀. Go to /demo to view the UI!'));

    // Serve Agent UI
    this.app.get('/demo', (req, res) => {
      res.sendFile(require('path').resolve(process.cwd(), 'demo.html'));
    });
    this.app.get('/demo2', (req, res) => {
      res.sendFile(require('path').resolve(process.cwd(), 'v2-demo.html'));
    });

    // Primary Booking Action Gateway 
    this.app.post('/api/vapi-webhook', this.verifier.verifySignature, async (req: Request, res: Response) => {
      try {
        const message = req.body?.message;
        if (message?.type !== 'tool-calls') return res.status(400).json({ error: 'Unsupported payload injection' });

        const toolCall = message.toolCalls[0];
        const functionName = toolCall?.function?.name;
        const args = toolCall?.function?.arguments || {};

        let rawEntityResult;

        // Strictly routes execution payloads natively into the Application Layer without business logic bleed
        switch (functionName) {
          case 'check_availability':
            rawEntityResult = await this.checkAvailability.execute(args.appointmentType, args.preferredDate, args.timezone);
            break;
          case 'book_appointment':
            // E.g., hydrating domain Request models goes here before firing the Application confirmed booking
            rawEntityResult = { externalBookingId: `bk-${Date.now()}` }; 
            break;
          default:
            throw new Error(`Unsupported explicit domain tool: ${functionName}`);
        }

        // Conversational directives injection
        const spokenResponse = this.responseGenerator.execute(functionName, rawEntityResult);

        // Required physical Vapi Schema bridging return
        return res.json({
          results: [{
            toolCallId: toolCall.id,
            result: spokenResponse
          }]
        });

      } catch (e: any) {
        console.error(`[BookingGateway] Error isolating orchestration: ${e.message}`);
        // Default to a 500 so fallback use-cases kick in natively on the Vapi side
        return res.status(500).json({ error: e.message });
      }
    });
  }

  public listen(port: number) {
    this.app.listen(port, () => console.log(`[SYS] Booking Action Gateway operational securely on port ${port}`));
  }
}
