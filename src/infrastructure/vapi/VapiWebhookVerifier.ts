import { Request, Response, NextFunction } from 'express';

/**
 * Infrastructure Adapter ensuring physical payload integrity preventing malicious
 * unauthorized bots from injecting fake booking schedules.
 */
export class VapiWebhookVerifier {
  constructor(private readonly expectedSecret: string) {}

  public verifySignature = (req: Request, res: Response, next: NextFunction) => {
    // In local non-prod development, we deliberately bypass if explicitly un-configured
    if (!this.expectedSecret) return next();
    
    const authHeader = req.headers['x-vapi-secret'];
    if (!authHeader || authHeader !== this.expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized webhook invocation bounds detected.' });
    }
    
    next();
  };
}
