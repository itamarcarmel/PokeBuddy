import { Injectable, Logger } from "@nestjs/common";
import { LlmProvider } from "./interfaces/llm-provider.interface";
import { AppConfigService } from "../../config/app-config.service";
import { GroqProvider } from "./providers/groq-provider.service";
import { OpenRouterProvider } from "./providers/openrouter-provider.service";

export type LlmProviderType = "groq" | "openrouter";

/**
 * Factory for creating LLM providers at application startup.
 *
 * Provider is selected based on LLM_PROVIDER environment variable.
 * No runtime switching - provider is fixed for the lifetime of the application.
 */
@Injectable()
export class LlmProviderFactory {
  private readonly logger = new Logger(LlmProviderFactory.name);

  constructor(
    private configService: AppConfigService,
    private groqProvider: GroqProvider,
    private openRouterProvider: OpenRouterProvider
  ) {}

  /**
   * Create the LLM provider based on configuration.
   * Called once at module initialization.
   */
  createProvider(): LlmProvider {
    const providerType = this.configService.llmProvider;

    this.logger.log(`🔧 Creating LLM Provider: ${providerType}`);

    switch (providerType) {
      case "groq":
        return this.groqProvider;
      case "openrouter":
        return this.openRouterProvider;
      default:
        throw new Error(
          `Unknown LLM provider: ${providerType}. Valid options: groq, openrouter`
        );
    }
  }
}
