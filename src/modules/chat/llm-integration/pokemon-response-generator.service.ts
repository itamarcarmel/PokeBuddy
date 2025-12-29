import { Injectable } from "@nestjs/common";
import { LlmService } from "../../llm/llm.service";
import { Logger } from "@nestjs/common";
import {
  POKEBUDDY_SYSTEM_PROMPT,
  POKEBUDDY_USER_PROMPT_WITH_DATA,
  POKEBUDDY_USER_PROMPT_NO_DATA,
  BATTLE_SIMULATION_PROMPT,
} from "./prompts/pokemon-prompts";
import { ConversationContext } from "../conversation/interfaces/conversation-context.interface";
import { FetchedApiData } from "../api-integration/api-data-fetcher.service";

/**
 * PokemonResponseGeneratorService - LLM Response Wrapper
 *
 * Specialized service for generating Pokemon chat responses using LLM.
 * Handles prompt construction and context formatting.
 *
 * Similar to MessageIntentClassifierService, this wraps LLM functionality
 * for a specific purpose: generating conversational Pokemon responses.
 */
@Injectable()
export class PokemonResponseGeneratorService {
  private readonly logger = new Logger(PokemonResponseGeneratorService.name);

  

  constructor(private readonly llmService: LlmService) {}

  /**
   * Generate a Pokemon-related response based on user message, API data, and conversation context
   *
   * @param userMessage - The user's input message
   * @param apiData - Fetched Pokemon API data (if any)
   * @param context - Conversation context (recent messages + summary)
   * @param isBattleSimulation - Whether this is a battle simulation request
   * @returns Generated response string from LLM
   */
  async generateResponse(
    userMessage: string,
    apiData: FetchedApiData,
    context: ConversationContext,
    isBattleSimulation: boolean = false
  ): Promise<string> {
    try {
      this.logger.log(
        `Generating response for: "${userMessage.substring(0, 50)}..."`
      );

      if (isBattleSimulation) {
        this.logger.log(`🎮 Battle simulation mode activated!`);
      }

      // Format conversation context
      const formattedContext = this.formatContext(context);

      // Build appropriate prompt based on whether we have API data
      const userPrompt = this.buildPrompt(
        userMessage,
        apiData,
        formattedContext,
        isBattleSimulation
      );

      // Generate response using LLM
      const response = await this.llmService.generate(
        userPrompt,
        POKEBUDDY_SYSTEM_PROMPT
      );

      this.logger.log(
        `Response generated successfully (${response.length} chars)`
      );

      return response;
    } catch (error) {
      this.logger.error(`Failed to generate response: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build the user prompt based on available data and intent
   */
  private buildPrompt(
    userMessage: string,
    apiData: FetchedApiData,
    formattedContext: string,
    isBattleSimulation: boolean
  ): string {
    const hasApiData = Object.keys(apiData).length > 0;

    if (hasApiData) {
      // Use battle simulation prompt if intent classifier determined it's a battle
      const promptTemplate = isBattleSimulation
        ? BATTLE_SIMULATION_PROMPT
        : POKEBUDDY_USER_PROMPT_WITH_DATA;

      return promptTemplate
        .replace("{conversationContext}", formattedContext)
        .replace("{userMessage}", userMessage)
        .replace("{apiData}", JSON.stringify(apiData, null, 2));
    } else {
      return POKEBUDDY_USER_PROMPT_NO_DATA.replace(
        "{conversationContext}",
        formattedContext
      ).replace("{userMessage}", userMessage);
    }
  }

  /**
   * Format conversation context into a string for prompt injection
   */
  private formatContext(context: ConversationContext | null): string {
    if (!context) {
      return "No previous conversation context.";
    }

    let contextString = "";

    // Add summary if exists
    if (context.summary) {
      contextString += `Previous Conversation Summary:\n`;
      contextString += `- Pokemon Discussed: ${context.summary.pokemonDiscussed.join(
        ", "
      )}\n`;
      contextString += `- Topics Covered: ${context.summary.topicsCovered.join(
        ", "
      )}\n`;
      contextString += `- Context: ${context.summary.lastKnownContext}\n\n`;
    }

    // Add recent messages
    if (context.recentMessages && context.recentMessages.length > 0) {
      contextString += `Recent Messages:\n`;
      context.recentMessages.forEach((msg) => {
        const role = msg.role === "user" ? "User" : "Assistant";
        contextString += `${role}: ${msg.content.substring(0, 150)}...\n`;
      });
    }

    return contextString || "No previous conversation context.";
  }
}


