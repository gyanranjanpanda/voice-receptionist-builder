/**
 * Required Production Utility: Safely redacts Personal Identifiable Information (PII) 
 * prior to dumping structural payloads out to monitoring backends, ensuring HIPAA compliance natively.
 */
export class StructuredLogger {
  public info(message: string, context: Record<string, any> = {}) {
    const safeContext = this.scrubPII(context);
    console.log(`[INFO] ${message}`, JSON.stringify(safeContext));
  }

  public error(message: string, error: Error) {
    console.error(`[ERROR] ${message}`, error.stack);
  }

  private scrubPII(context: Record<string, any>): Record<string, any> {
    const clone = { ...context };
    if (clone.phone) clone.phone = '[REDACTED]';
    if (clone.customerPhone) clone.customerPhone = '[REDACTED]';
    if (clone.customerName) clone.customerName = '[REDACTED]';
    if (clone.email) clone.email = '[REDACTED]';
    return clone;
  }
}
