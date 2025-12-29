import { Injectable, Logger } from "@nestjs/common";
import { LlmProvider } from "./interfaces/llm-provider.interface";
import { LlmProviderFactory } from "./llm-provider.factory";

/**
 * LlmService - Facade for LLM operations
 *
 * Provides a stable API for the rest of the application.
 * Delegates all operations to the configured LLM provider (Groq or OpenRouter).
 * Provider is selected at startup based on LLM_PROVIDER environment variable.
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly provider: LlmProvider;

  constructor(private providerFactory: LlmProviderFactory) {
    // Load-time provider selection (NOT runtime)
    this.provider = this.providerFactory.createProvider();
    this.logger.log(
      `✅ LLM Service initialized with provider: ${this.provider.getProviderName()}`
    );
  }

  /**
   * Generate text completion from prompt
   */
  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    return this.provider.generate(prompt, systemPrompt);
  }

  /**
   * Test connection to LLM provider
   */
  async checkConnection(): Promise<boolean> {
    return this.provider.checkConnection();
  }

  /**
   * Get LLM service status
   */
  async getStatus(): Promise<{
    provider: string;
    connected: boolean;
  }> {
    const isConnected = await this.checkConnection();

    return {
      provider: this.provider.getProviderName(),
      connected: isConnected,
    };
  }
}
