/**
 * Maps static structured JSON payloads from external adapters into natural language 
 * conversational directives for the AI system prompt dynamically.
 */
export class GenerateVoiceResponseFromToolResult {
  public execute(action: string, resultData: any): string {
    switch (action) {
      case 'check_availability':
        if (!resultData || resultData.length === 0) {
          return "System indicates no available slots for this requested day. Apologize and ask if there's an alternative date.";
        }
        return `System found the following available slots: ${JSON.stringify(resultData)}. Respond conversationally by reading them to the caller and asking them to choose one.`;
      
      case 'confirm_booking':
        return `Booking successfully confirmed in the database (Tracking ID: ${resultData.externalBookingId}). Instruct the caller that they are all set, read back the time as a final check, and gracefully end the call unless they have other questions.`;
      
      case 'hold_slot':
        return resultData === true 
          ? "Slot temporarily held. Tell the caller the time works and strictly ask for their full name to finalize it." 
          : "That slot was taken immediately before we could lock it. Apologize and offer the next closest time.";
      
      default:
        return "System action successfully executed in the background.";
    }
  }
}
