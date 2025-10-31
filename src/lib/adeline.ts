import { Gateway } from '@adaline/gateway';
import { ChatModelV1 } from '@adaline/provider';
import { Langfuse } from 'langfuse';
import { indexGitHubRepo, extractGitHubURL, runRAGChain } from "./utils";

const langfuse = new Langfuse({
    publicKey: process.env.NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY || "pk-lf-public-key",
  secretKey: process.env.NEXT_PUBLIC_LANGFUSE_SECRET_KEY || "sk-lf-secret-key",
});

// Initialize Gateway without specific cache types for now
const gateway = new Gateway();

// Provider configurations
interface ProviderConfig {
  name: string;
  apiKey?: string;
  baseURL?: string;
  models: string[];
}

// Available providers configuration
const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  adeline: {
    name: 'adeline',
    apiKey: '', // No API key needed for chat.knirv.com
    baseURL: process.env.CLOUDFLARE_BASE_URL || 'https://chat.knirv.com',
    models: ['@cf/openai/gpt-oss-120b'] // Default model from env
  },
  google: {
    name: 'google',
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro']
  },
  openai: {
    name: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
  },
  anthropic: {
    name: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY,
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
  }
};

// Default model configuration
const DEFAULT_MODEL = process.env.CLOUDFLARE_MODEL || '@cf/openai/gpt-oss-120b';
const DEFAULT_PROVIDER = 'adeline';

// Model mapping for backward compatibility
const MODEL_MAPPING: Record<string, { provider: string; model: string }> = {
  'gemini-1.5-pro': { provider: 'google', model: 'gemini-pro' },
  'gemini-1.5-flash': { provider: 'google', model: 'gemini-pro' },
  'gemini-1.5-flash-latest': { provider: 'google', model: 'gemini-pro' },
  'gemini-pro': { provider: 'google', model: 'gemini-pro' },
  'gpt-4': { provider: 'openai', model: 'gpt-4' },
  'gpt-4-turbo': { provider: 'openai', model: 'gpt-4-turbo' },
  'gpt-3.5-turbo': { provider: 'openai', model: 'gpt-3.5-turbo' },
  'claude-3-opus': { provider: 'anthropic', model: 'claude-3-opus' },
  'claude-3-sonnet': { provider: 'anthropic', model: 'claude-3-sonnet' },
  'claude-3-haiku': { provider: 'anthropic', model: 'claude-3-haiku' }
};

interface InferenceOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  provider?: string;
  enableCache?: boolean;
}

interface InferenceResult {
  response: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latency: number;
  provider: string;
  model: string;
}

class AdelineInference {
  private gateway: Gateway;

  constructor() {
    this.gateway = gateway;
  }

  /**
   * Get the appropriate model configuration for a given model name
   */
  private getModelConfig(modelName: string = DEFAULT_MODEL): { provider: string; model: string; config: ProviderConfig } {
    const mapping = MODEL_MAPPING[modelName];
    if (!mapping) {
      // Default fallback
      return {
        provider: DEFAULT_PROVIDER,
        model: DEFAULT_MODEL,
        config: PROVIDER_CONFIGS[DEFAULT_PROVIDER]
      };
    }

    const config = PROVIDER_CONFIGS[mapping.provider];
    if (!config) {
      throw new Error(`Provider ${mapping.provider} not configured`);
    }

    return {
      provider: mapping.provider,
      model: mapping.model,
      config
    };
  }

  /**
   * Create a ChatModelV1 instance for the given provider and model
   */
  private async createModel(provider: string, modelName: string): Promise<ChatModelV1> {
    const config = PROVIDER_CONFIGS[provider];
    if (!config) {
      throw new Error(`Provider ${provider} not configured`);
    }

    if (!config.apiKey) {
      throw new Error(`API key not configured for provider ${provider}`);
    }

    // Import the appropriate provider dynamically
    let providerModule: any;
    try {
      switch (provider) {
        case 'google':
          providerModule = await import('@adaline/google');
          break;
        case 'openai':
          providerModule = await import('@adaline/openai');
          break;
        case 'anthropic':
          providerModule = await import('@adaline/anthropic');
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      throw new Error(`Failed to load provider ${provider}: ${error}`);
    }

    // Map model names to class names
    const modelClassMap: Record<string, Record<string, string>> = {
      'google': {
        'gemini-1.5-pro': 'Gemini1_5Pro',
        'gemini-1.5-flash': 'Gemini1_5Flash',
        'gemini-pro': 'Gemini1_5Pro', // Use 1.5 Pro as fallback for legacy gemini-pro
        'gemini-1.5-pro-latest': 'Gemini1_5ProLatest',
        'gemini-1.5-flash-latest': 'Gemini1_5FlashLatest',
        'gemini-2.0-flash': 'Gemini2_0Flash',
        'gemini-2.5-pro': 'Gemini2_5Pro',
        'gemini-2.5-flash': 'Gemini2_5Flash'
      },
      'openai': {
        'gpt-4': 'GPT4',
        'gpt-4-turbo': 'GPT4Turbo',
        'gpt-3.5-turbo': 'GPT3_5Turbo'
      },
      'anthropic': {
        'claude-3-opus': 'Claude3Opus',
        'claude-3-sonnet': 'Claude3Sonnet',
        'claude-3-haiku': 'Claude3Haiku'
      }
    };

    const className = modelClassMap[provider]?.[modelName];
    if (!className) {
      throw new Error(`Model ${modelName} not supported for provider ${provider}`);
    }

    const ModelClass = providerModule[className];
    if (!ModelClass) {
      throw new Error(`Model class ${className} not found in provider ${provider}`);
    }

    return new ModelClass({
      apiKey: config.apiKey,
      modelName: modelName,
      baseURL: config.baseURL
    });
  }

  /**
   * Main inference method that replaces both Gemini and Model Deployer
   */
  async runInference(prompt: string, options: InferenceOptions = {}): Promise<InferenceResult> {
    const startTime = Date.now();

    try {
      const { provider, model, config } = this.getModelConfig(options.model);

      // Handle Adeline provider (chat.knirv.com) directly
      if (provider === 'adeline') {
        return await this.runAdelineInference(prompt, options, config);
      }

      // Handle other providers through Adaline Gateway
      const modelInstance = await this.createModel(provider, model);

      // Check for GitHub URL processing (from original gemini.ts)
      const githubURL = await extractGitHubURL(prompt);
      let processedPrompt = prompt;

      if (githubURL) {
        console.log("GitHub URL detected, processing with RAG");
        try {
          const ragResponse = await runRAGChain({
            prompt,
            apiKey: config.apiKey!,
            modelName: model,
            weaviateURL: process.env.NEXT_PUBLIC_WEAVIATE_URL || "",
            weaviateApiKey: process.env.NEXT_PUBLIC_WEAVIATE_API_KEY || "",
            className: "CodeFiles"
          });
          processedPrompt = ragResponse.prompt;
        } catch (error) {
          console.error("Error processing GitHub URL with RAG:", error);
          // Continue with original prompt if RAG fails
        }
      }

      // Prepare messages for Adeline Gateway
      const messages = [{
        role: 'user' as const,
        content: [{
          modality: 'text' as const,
          value: processedPrompt
        }]
      }];

      // Prepare config
      const gatewayConfig: Record<string, any> = {
        temperature: options.temperature ?? 0.9,
        maxOutputTokens: options.maxTokens ?? 2048
      };

      // Make the inference call
      const response = await this.gateway.completeChat({
        model: modelInstance,
        config: gatewayConfig,
        messages,
        options: {
          enableCache: options.enableCache ?? true
        }
      });

      const latency = Date.now() - startTime;

      // Extract the response text
      const responseText = response.response.messages[0]?.content
        .filter(c => c.modality === 'text')
        .map(c => c.value)
        .join('') || '';

      return {
        response: responseText,
        usage: response.response.usage,
        latency,
        provider,
        model
      };

    } catch (error) {
      console.error("Adeline inference error:", error);
      throw new Error(`Inference failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle inference for Adeline provider (chat.knirv.com)
   */
  private async runAdelineInference(prompt: string, options: InferenceOptions, config: ProviderConfig): Promise<InferenceResult> {
    const startTime = Date.now();

    try {
      // For now, provide a mock response since the endpoint may not be fully set up
      // TODO: Replace with actual API call when chat.knirv.com is ready
      console.log(`Adeline inference called with prompt: "${prompt.substring(0, 100)}..."`);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const latency = Date.now() - startTime;

      // Mock response - replace with actual API call
      const responseText = `Hello! I received your message: "${prompt}". This is a mock response from the Adeline system. The chat.knirv.com endpoint integration is in progress.`;

      return {
        response: responseText,
        usage: {
          promptTokens: Math.ceil(prompt.length / 4),
          completionTokens: Math.ceil(responseText.length / 4),
          totalTokens: Math.ceil((prompt.length + responseText.length) / 4)
        },
        latency,
        provider: 'adeline',
        model: config.models[0]
      };

    } catch (error) {
      console.error("Adeline direct inference error:", error);
      throw new Error(`Adeline inference failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available models
   */
  getAvailableModels(): string[] {
    return Object.keys(MODEL_MAPPING);
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    return Object.keys(PROVIDER_CONFIGS);
  }

  /**
   * Check if a provider is configured
   */
  isProviderConfigured(provider: string): boolean {
    const config = PROVIDER_CONFIGS[provider];
    // Adeline provider doesn't require API key
    if (provider === 'adeline') {
      return !!config && !!config.baseURL;
    }
    return config && !!config.apiKey;
  }
}

// Export singleton instance
export default new AdelineInference();

// Export the class for testing
export { AdelineInference };
