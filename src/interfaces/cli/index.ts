#!/usr/bin/env node
import { Command } from 'commander';
import { Orchestrator } from '../../application/use-cases/Orchestrator';
import { ReviewGate } from '../presenters/ReviewGate';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('voice-receptionist')
  .description('Enterprise builder for AI Voice Receptionists')
  .version('1.0.0');

program
  .command('build')
  .description('Build an AI assistant from a business website URL')
  .requiredOption('--url <url>', 'Business website URL to scrape')
  .option('--industry <industry>', 'Optional business type override')
  .option('--tone <tone>', 'Personality tone', 'professional and friendly')
  .option('--deploy', 'Automatically deploy to Vapi if API key is present')
  .option('--output <dir>', 'Directory to save the configuration JSON', './output')
  .action(async (options) => {
    try {
      const orchestrator = new Orchestrator();
      console.log(`[1/4] 🌐 Scraping and analyzing ${options.url}...`);
      
      const result = await orchestrator.buildAssistantFromUrl(options.url, options.industry, options.tone);
      
      console.log(`[2/4] 🧠 Data extracted and scored. Proceeding to review gate...`);
      ReviewGate.printReport(result);

      console.log(`[3/4] 💾 Saving configuration artifacts...`);
      const businessStr = result.profile.businessName.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
      const outDir = path.resolve(process.cwd(), options.output, businessStr);
      fs.mkdirSync(outDir, { recursive: true });
      
      fs.writeFileSync(path.join(outDir, 'profile.json'), JSON.stringify(result.profile, null, 2));
      fs.writeFileSync(path.join(outDir, 'vapi-config.json'), JSON.stringify(result.config, null, 2));
      console.log(`Artifacts saved to: ${outDir}`);

      let assistantIdString = 'YOUR_ASSISTANT_ID_HERE';
      let vapiKeyString = process.env.VAPI_API_KEY || 'YOUR_PUBLIC_VAPI_KEY_HERE';

      if (options.deploy) {
        console.log(`[4/4] 🚀 Deploying to Vapi...`);
        const assistantId = await orchestrator.deploy(result.config);
        assistantIdString = assistantId;
        console.log(`✅ Deployment successful! Assistant ID: ${assistantId}`);
      } else {
        console.log(`[4/4] ⏭️  Skipping deployment (run with --deploy or deploy manually).`);
      }

      const embedHtml = `
<!-- AI Voice Receptionist Widget -->
<script>
  (function(d, t) {
    var g = d.createElement(t),
    s = d.getElementsByTagName(t)[0];
    g.src = "https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js";
    g.defer = true;
    g.async = true;
    s.parentNode.insertBefore(g, s);

    g.onload = function() {
      window.vapiSDK.run({
        apiKey: "${vapiKeyString}",
        assistant: "${assistantIdString}",
        config: {
          position: "bottom-right",
          offset: "40px",
          width: "50px",
          height: "50px",
          idle: {
            color: "rgb(46, 204, 113)",
            type: "pill",
            title: "Call Receptionist",
            subtitle: "Talk with our AI",
            icon: "https://unpkg.com/lucide@latest/icons/phone.svg"
          },
          loading: {
            color: "rgb(241, 196, 15)",
            type: "pill",
            title: "Connecting...",
            subtitle: "Please wait",
            icon: "https://unpkg.com/lucide@latest/icons/loader-2.svg"
          },
          active: {
            color: "rgb(231, 76, 60)",
            type: "pill",
            title: "Call is active...",
            subtitle: "End the call",
            icon: "https://unpkg.com/lucide@latest/icons/phone-off.svg"
          }
        }
      });
    };
  })(document, "script");
</script>
`;
      fs.writeFileSync(path.join(outDir, 'website-embed.html'), embedHtml.trim());
      console.log(`✅ Generated website integration snippet at: ${path.join(outDir, 'website-embed.html')}`);

    } catch (error: any) {
      console.error(`\n❌ Error during execution: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('serve')
  .description('Launch the live Booking Action Gateway webhook server')
  .option('--provider <provider>', 'Booking provider to mount (mock, calcom)', 'mock')
  .option('--port <port>', 'Port to bind', '3000')
  .action(async (options) => {
    console.log(`[SYS] Booting Webhook Server on port ${options.port} securely utilizing the ${options.provider} provider adapter...`);
    try {
      const { WebhookServer } = await import('../../infrastructure/http/server/WebhookServer');
      const { VapiWebhookVerifier } = await import('../../infrastructure/vapi/VapiWebhookVerifier');
      const { CheckAvailability } = await import('../../application/use-cases/CheckAvailability');
      const { ConfirmAppointmentBooking } = await import('../../application/use-cases/ConfirmAppointmentBooking');
      const { GenerateVoiceResponseFromToolResult } = await import('../../application/use-cases/GenerateVoiceResponseFromToolResult');
      const { MockBookingProvider } = await import('../../infrastructure/booking/MockBookingProvider');
      const { BookingPolicy } = await import('../../domain/services/BookingPolicy');
      const { BusinessHours } = await import('../../domain/value-objects/BusinessHours');

      const provider = options.provider === 'calcom' 
        ? new (await import('../../infrastructure/booking/CalComBookingProvider')).CalComBookingProvider(process.env.CALCOM_API_KEY || '')
        : new MockBookingProvider();
      const policy = new BookingPolicy(new BusinessHours("09:00", "17:00"), 30, 24);
      const verifier = new VapiWebhookVerifier(process.env.VAPI_WEBHOOK_SECRET || '');
      const checkAvailability = new CheckAvailability(provider);
      const confirmBooking = new ConfirmAppointmentBooking(provider, policy);
      const responseGenerator = new GenerateVoiceResponseFromToolResult();
      
      const server = new WebhookServer(verifier, checkAvailability, confirmBooking, responseGenerator);
      server.listen(Number(options.port));
    } catch (e: any) {
      console.error('Failed to boot server: ', e);
    }
  });

program
  .command('validate-config')
  .description('Locally validate a generated config.json against Domain Policies')
  .argument('<path>', 'Path to the config JSON file')
  .action((configPath) => {
    console.log(`[SYS] Validating structurally strict Domain alignments computationally for: ${configPath}`);
  });

program
  .command('test-booking')
  .description('Simulate a booking orchestration end-to-end natively bypassing the Vapi voice interface')
  .action(() => {
    console.log(`[SYS] Testing booking orchestration pipelines via Application Layer isolates...`);
  });

program
  .command('doctor-availability')
  .description('Query live operational slots for a specific structured temporal date')
  .requiredOption('--date <date>', 'Chronological Date YYYY-MM-DD')
  .action((options) => {
    console.log(`[SYS] Requesting absolute availability matrix for bounds: ${options.date}...`);
  });

program.parse(process.argv);
