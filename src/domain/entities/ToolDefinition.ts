/**
 * Represents the strict JSON Schema definition required by Vapi / OpenAI 
 * to execute deterministic Function Calling during voice interactions.
 */
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required: string[];
    };
  };
  server?: {
    url: string;
    secret?: string;
  };
}
