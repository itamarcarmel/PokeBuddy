import { Module } from "@nestjs/common";
import { LlmService } from "./llm.service";
import { LlmProviderFactory } from "./llm-provider.factory";
import { GroqProvider } from "./providers/groq-provider.service";
import { OpenRouterProvider } from "./providers/openrouter-provider.service";

@Module({
  providers: [
    // Provider implementations
    GroqProvider,
    OpenRouterProvider,
    // Factory
    LlmProviderFactory,
    // Main service (facade)
    LlmService,
  ],
  exports: [LlmService], // Only expose the facade
})
export class LlmModule {}
