/**
 * Converts structured tool results into natural spoken English.
 * The AI reads these responses to the caller — they must sound human, never technical.
 */
export class GenerateVoiceResponseFromToolResult {
  public execute(action: string, resultData: Record<string, unknown> | unknown[]): string {
    switch (action) {
      case 'check_availability':
        return this.formatAvailabilityResponse(resultData);

      case 'book_appointment':
        return this.formatBookingResponse(resultData as Record<string, unknown>);

      case 'capture_caller_info':
        return this.formatLeadCaptureResponse(resultData as Record<string, unknown>);

      case 'hold_slot':
        return (resultData as unknown) === true
          ? "That time is held for you. Can I get your full name to finalize the booking?"
          : "I'm sorry, that slot was just taken. Let me check what else is available.";

      default:
        return "Got it, I've taken care of that for you.";
    }
  }

  private formatAvailabilityResponse(slots: Record<string, unknown> | unknown[]): string {
    const slotArray = Array.isArray(slots) ? slots : [];

    if (slotArray.length === 0) {
      return "I'm sorry, we don't have any openings on that day. Would another day work for you?";
    }

    const formattedTimes = slotArray
      .slice(0, 3)
      .map((rawSlot: unknown) => {
        const slot = rawSlot as Record<string, unknown>;
        const startTime = slot.startTime as Record<string, string> | undefined;
        const isoString = startTime?.isoString || (slot as Record<string, string>).startTime || '';
        return this.formatTimeForSpeech(isoString);
      })
      .filter(Boolean);

    if (formattedTimes.length === 0) {
      return "I'm having trouble reading the available times. Would you like to try a different day?";
    }

    if (formattedTimes.length === 1) {
      return `We have ${formattedTimes[0]} available. Does that work for you?`;
    }

    if (formattedTimes.length === 2) {
      return `We have ${formattedTimes[0]} and ${formattedTimes[1]} available. Which works better for you?`;
    }

    const last = formattedTimes.pop();
    return `We have ${formattedTimes.join(', ')}, and ${last} available. Which time works best?`;
  }

  private formatBookingResponse(booking: Record<string, unknown>): string {
    if (!booking || booking.error) {
      return "I'm sorry, I wasn't able to complete that booking. Let me connect you to our front desk so they can help.";
    }

    const service = booking.service || 'your appointment';
    const date = booking.date || '';
    const time = booking.time || '';
    const patientName = booking.patientName || '';

    if (date && time) {
      return `You're all set, ${patientName}! I've booked your ${service} for ${date} at ${time}. We'll see you then!`;
    }

    return `Your appointment has been booked successfully. You're all set!`;
  }

  private formatLeadCaptureResponse(captureResult: Record<string, unknown>): string {
    if (captureResult?.captured) {
      return "Got it, I've taken down your information. Someone from our team will give you a call back shortly.";
    }
    return "I wasn't able to save your information. Let me connect you to our front desk.";
  }

  private formatTimeForSpeech(isoString: string): string {
    if (!isoString) return '';

    try {
      const date = new Date(isoString);
      if (Number.isNaN(date.getTime())) return '';

      let hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';

      hours = hours % 12 || 12;

      if (minutes === 0) {
        return `${hours} ${ampm}`;
      }

      const paddedMinutes = minutes.toString().padStart(2, '0');
      return `${hours}:${paddedMinutes} ${ampm}`;
    } catch {
      return '';
    }
  }
}
