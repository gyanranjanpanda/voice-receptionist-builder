#!/usr/bin/env node
import { Command } from 'commander';
import { Orchestrator } from '../../application/use-cases/Orchestrator';
import { ReviewGate } from '../presenters/ReviewGate';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();
const orchestrator = new Orchestrator();

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

      if (options.deploy) {
        console.log(`[4/4] 🚀 Deploying to Vapi...`);
        const assistantId = await orchestrator.deploy(result.config);
        console.log(`✅ Deployment successful! Assistant ID: ${assistantId}`);
      } else {
        console.log(`[4/4] ⏭️  Skipping deployment (run with --deploy or deploy manually).`);
      }

    } catch (error: any) {
      console.error(`\n❌ Error during execution: ${error.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
