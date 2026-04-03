import { ToolDefinition } from '../../domain/entities/ToolDefinition';

/**
 * Mappable Infrastructure Adapter taking the pure Domain Tool structures 
 * and actively bridging them to the specific SaaS schema mandated by Vapi JSON shapes.
 */
export class VapiToolMapper {
  public toVapiPayload(tools: ToolDefinition[], serverUrl: string, secret?: string) {
    return tools.map(tool => ({
      ...tool,
      server: {
        url: serverUrl,
        secret: secret || ''
      }
    }));
  }
}
