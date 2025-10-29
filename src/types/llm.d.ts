declare module '@themaximalist/llm.js' {
  export interface LLMOptions {
    apiKey?: string;
    service: 'openai' | 'anthropic' | 'deepseek' | 'gemini';
    model: string;
    temperature?: number;
    maxTokens?: number;
  }

  export interface ChatOptions {
    jsonSchema?: Record<string, unknown>;
    systemPrompt?: string;
    stream?: boolean;
    stream_handler?: (chunk: string) => void;
    signal?: AbortSignal;
  }

  export interface CompleteOptions {
    jsonSchema?: Record<string, unknown>;
    systemPrompt?: string;
  }

  export class LLM {
    constructor(options: LLMOptions);
    
    /**
     * Complete a one-off prompt
     * @param prompt The input prompt
     * @param options Completion options
     * @returns Promise of string or object (if jsonSchema is provided)
     */
    complete(prompt: string, options?: CompleteOptions): Promise<string | Record<string, unknown>>;
    
    /**
     * Chat with message history
     * @param messages Array of chat messages
     * @param options Chat options
     * @returns Promise of string or object (if jsonSchema is provided)
     */
    chat(messages: Array<{role: string, content: string}>, options?: ChatOptions): Promise<string | Record<string, unknown>>;
  }

  export default LLM;
}