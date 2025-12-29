import { Injectable } from "@nestjs/common";
import { MessageIntentClassifierService } from "../llm-integration/message-intent-classifier.service";
import {
  ApiDataFetcherService,
  FetchedApiData,
} from "../api-integration/api-data-fetcher.service";
import { SummaryService } from "../llm-integration/summary.service";
import { PokemonResponseGeneratorService } from "../llm-integration/pokemon-response-generator.service";
import { ChatDto, ChatResponse } from "../dto/chat.dto";
import { ChatSession } from "../../../database/entities/chat-session.entity";
import { Logger } from "@nestjs/common";
import { ConversationMessage } from "../conversation/interfaces/conversation-context.interface";
import { parseConversationSummary } from "../../../common/utils/type-guards";
import { AppConfigService } from "../../../config/app-config.service";

/**
 * ChatOrchestrationService - Business logic orchestrator
 *
 * Handles the complete chat workflow:
 * 1. Context building and intent classification
 * 2. API data fetching (if needed)
 * 3. LLM response generation
 * 4. Summary triggering
 */
@Injectable()
export class ChatOrchestrationService {
  private readonly logger = new Logger(ChatOrchestrationService.name);

  constructor(
    private readonly apiDataFetcher: ApiDataFetcherService,
    private readonly summaryService: SummaryService,
    private readonly responseGenerator: PokemonResponseGeneratorService,
    private readonly intentClassifier: MessageIntentClassifierService,
    private readonly configService: AppConfigService
  ) {}

  async processChat(
    chatDto: ChatDto,
    session: ChatSession,
    recentMessages: ConversationMessage[]
  ): Promise<ChatResponse> {
    const startTime = Date.now();
    try {
      const resourcesUsed: Array<{
        source: string;
        parameter: string;
        responseTime: number;
      }> = [];
      const chatSessionId = session.id;

      // Step 1: Build context and classify message
      const classificationStart = Date.now();
      const context = this.buildConversationContext(session, recentMessages);
      const classification = await this.classifyUserMessage(chatDto.message, context);
      const classificationTime = Date.now() - classificationStart;

      // Step 2: Handle non-Pokemon messages
      if (!classification.isPokemonRelated) {
        const totalTime = Date.now() - startTime;
        return this.handleNonPokemonMessage(
          chatDto,
          chatSessionId,
          classification,
          resourcesUsed,
          classificationTime,
          totalTime
        );
      }

      // Step 3: Fetch API data and generate response
      return await this.handlePokemonMessage(
        chatDto,
        session,
        context,
        classification,
        resourcesUsed,
        classificationTime,
        startTime
      );
    } catch (error) {
      this.logger.error(`Chat failed: ${error.message}`);
      return this.createErrorResponse(chatDto, session.id, error);
    }
  }

  /**
   * Build conversation context from session and recent messages
   */
  private buildConversationContext(
    session: ChatSession,
    recentMessages: ConversationMessage[]
  ) {
    let summary = undefined;
    if (session.conversationSummary) {
      summary = parseConversationSummary(session.conversationSummary);
      if (!summary) {
        this.logger.warn(
          `Failed to parse conversation summary for session ${session.id}`
        );
      }
    }

    return { recentMessages, summary };
  }

  /**
   * Classify user message with context
   */
  private async classifyUserMessage(message: string, context: any) {
    this.logger.log(`📝 Step 1: Classifying message`);
    return await this.intentClassifier.classifyMessage(message, context);
  }

  /**
   * Handle Pokemon-related messages
   */
  private async handlePokemonMessage(
    chatDto: ChatDto,
    session: ChatSession,
    context: any,
    classification: any,
    resourcesUsed: Array<{ source: string; parameter: string; responseTime: number }>,
    classificationTime: number,
    startTime: number
  ): Promise<ChatResponse> {
    // Step 3: Fetch API data if needed
    const apiFetchStart = Date.now();
    this.logger.log(
      `🔍 Step 2: Fetching data from ${classification.requiredEndpoints.length} endpoints`
    );
    const apiData: FetchedApiData = await this.apiDataFetcher.fetchEndpointData(
      classification.requiredEndpoints,
      resourcesUsed
    );
    const apiFetchTime = Date.now() - apiFetchStart;

    // Step 4: Generate LLM response
    const llmStart = Date.now();
    this.logger.log(`🤖 Step 3: Generating LLM response`);
    const response = await this.responseGenerator.generateResponse(
      chatDto.message,
      apiData,
      context,
      classification.isBattleSimulation || false
    );
    const llmTime = Date.now() - llmStart;

    // Step 5: Trigger summary if needed (fire and forget)
    this.summaryService.generateAndUpdateSummary(session.id).catch((error) => {
      this.logger.error(`Summary update failed: ${error.message}`);
    });

    const totalTime = Date.now() - startTime;

    // Return success response with enhanced debug info
    return {
      message: chatDto.message,
      response,
      chatSessionId: session.id,
      timestamp: new Date(),
      debug: {
        resourcesUsed,
        llm: {
          connected: true,
          provider: this.getLlmProvider(),
          model: this.getLlmModel(),
        },
        classification: {
          isPokemonRelated: classification.isPokemonRelated,
          isBattleSimulation: classification.isBattleSimulation || false,
          endpointsCount: classification.requiredEndpoints.length,
          processingTime: classificationTime,
        },
        timing: {
          classification: classificationTime,
          apiFetch: apiFetchTime,
          llmGeneration: llmTime,
          total: totalTime,
        },
        apiDataFetched: Object.keys(apiData).length > 0,
      },
    };
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    chatDto: ChatDto,
    chatSessionId: number,
    error: any
  ): ChatResponse {
    return {
      message: chatDto.message,
      response: `❌ Sorry, I encountered an error: ${error.message}. Please make sure everything is configured properly.`,
      chatSessionId,
      timestamp: new Date(),
      error: true,
    };
  }

  /**
   * Handle case when message is not Pokemon-related
   */
  private handleNonPokemonMessage(
    chatDto: ChatDto,
    chatSessionId: number,
    classification: any,
    resourcesUsed: Array<{ source: string; parameter: string; responseTime: number }>,
    classificationTime: number,
    totalTime: number
  ): ChatResponse {
    const response = `I'm PokeBuddy, your friendly Pokemon expert! 🎮 I specialize in all things Pokemon.

I noticed your question isn't about Pokemon. While I'd love to help with everything, my expertise is in the world of Pokemon - battles, evolutions, stats, abilities, and more!

Feel free to ask me anything Pokemon-related, or just chat about your favorite Pokemon! What would you like to know? 😊`;

    this.logger.log(`🔀 Message not Pokemon-related, sending friendly redirect`);

    return {
      message: chatDto.message,
      response,
      chatSessionId,
      timestamp: new Date(),
      debug: {
        resourcesUsed,
        llm: {
          connected: true,
          provider: this.getLlmProvider(),
          model: this.getLlmModel(),
        },
        classification: {
          isPokemonRelated: classification.isPokemonRelated,
          isBattleSimulation: false,
          endpointsCount: 0,
          processingTime: classificationTime,
        },
        timing: {
          classification: classificationTime,
          apiFetch: 0,
          llmGeneration: 0,
          total: totalTime,
        },
      },
    };
  }

  /**
   * Get current LLM provider name from config
   */
  private getLlmProvider(): string {
    const provider = this.configService.llmProvider;
    return provider.charAt(0).toUpperCase() + provider.slice(1); // Capitalize
  }

  /**
   * Get current LLM model name from config
   */
  private getLlmModel(): string {
    const provider = this.configService.llmProvider;
    return provider === "groq"
      ? this.configService.groqModel
      : this.configService.openRouterModel;
  }
}
