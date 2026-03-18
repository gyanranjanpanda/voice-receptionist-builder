import { BuildRunResult } from '../../application/use-cases/Orchestrator';

export class ReviewGate {
  /**
   * Presenter for the Human Review Gate.
   * Outputs business identity, extraction confidence, and potential legal/business risks.
   */
  static printReport(result: BuildRunResult): void {
    console.log('\n======================================');
    console.log(`🎙️  AI VOICE RECEPTIONIST: ${result.profile.businessName}`);
    console.log('======================================\n');
    
    console.log('📄 EXTRACTED DATA SUMMARY:');
    console.log(`- Industry: ${result.profile.industry || 'Unknown'}`);
    console.log(`- Phone: ${result.profile.phone || 'Unknown'}`);
    console.log(`- Services: ${result.profile.services.length} extracted`);
    console.log(`- FAQs: ${result.profile.faqs.length} extracted`);
    
    console.log('\n⚠️  HUMAN REVIEW GATE & RISKS:');
    if (result.flags.length === 0) {
      console.log('✅ No major risks detected. Data structural integrity looks solid.');
    } else {
      result.flags.forEach(flag => {
        const icon = flag.severity === 'high' ? '🚨' : (flag.severity === 'medium' ? '⚠️' : 'ℹ️');
        console.log(`${icon} [${flag.severity.toUpperCase()}] ${flag.field}: ${flag.issue}`);
      });
      console.log('\n📌 ACTION REQUIRED: Please review the warnings above before deploying.');
    }
    
    console.log('\n💬 SYSTEM PROMPT PREVIEW [Truncated]:');
    const promptPreview = result.config.systemPrompt.length > 500 
      ? result.config.systemPrompt.substring(0, 500) + '...\n[Prompt Truncated]' 
      : result.config.systemPrompt;
    
    console.log(promptPreview);
    console.log('======================================\n');
  }
}
