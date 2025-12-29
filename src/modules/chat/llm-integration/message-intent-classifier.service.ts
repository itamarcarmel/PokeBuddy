import { Injectable } from "@nestjs/common";
import { LlmService } from "../../llm/llm.service";
import { Logger } from "@nestjs/common";
import {
  MESSAGE_CLASSIFICATION_PROMPT,
  MESSAGE_CLASSIFICATION_SYSTEM_PROMPT,
} from "./prompts/pokemon-prompts";
import { ConversationContext } from "../conversation/interfaces/conversation-context.interface";

export interface IntentClassification {
  isPokemonRelated: boolean;
  pokemonName?: string;
  correctedPokemonName?: string; // Corrected spelling if user made a typo
  requiredEndpoints: EndpointRequest[];
  reasoning?: string;
  isBattleSimulation?: boolean; // True if user wants to simulate a battle
  randomPokemonRequest?: {
    count: number; // How many random Pokemon to generate
    generation?: number; // Optional: specific generation (1-9)
    type?: string; // Optional: specific type filter
  };
}

export interface EndpointRequest {
  endpoint: "pokemon" | "species" | "ability" | "move" | "type" | "evolution";
  parameter: string | number;
}

@Injectable()
export class MessageIntentClassifierService {
  private readonly logger = new Logger(MessageIntentClassifierService.name);

  constructor(private readonly llmService: LlmService) {}

  async classifyMessage(
    userMessage: string,
    context?: ConversationContext
  ): Promise<IntentClassification> {
    try {
      this.logger.log(`Classifying message: "${userMessage.substring(0, 50)}..."`);

      let contextString = "";
      if (context) {
        if (context.summary) {
          contextString += `\nConversation Summary:\n`;
          contextString += `- Pokemon discussed: ${context.summary.pokemonDiscussed.join(
            ", "
          )}\n`;
          contextString += `- Topics covered: ${context.summary.topicsCovered.join(
            ", "
          )}\n`;
          contextString += `- Context: ${context.summary.lastKnownContext}\n`;
        }
        if (context.recentMessages && context.recentMessages.length > 0) {
          contextString += `\nRecent conversation:\n`;
          context.recentMessages.forEach((msg) => {
            contextString += `${
              msg.role === "user" ? "User" : "Assistant"
            }: ${msg.content.substring(0, 100)}...\n`;
          });
        }
      }

      const classificationPrompt = MESSAGE_CLASSIFICATION_PROMPT.replace(
        "{userMessage}",
        userMessage
      ).replace("{conversationContext}", contextString || "No previous context.");

      const llmResponse = await this.llmService.generate(
        classificationPrompt,
        MESSAGE_CLASSIFICATION_SYSTEM_PROMPT
      );

      this.logger.log(
        `LLM Classification Response: ${llmResponse.substring(0, 100)}...`
      );

      // Clean up the response: remove markdown, comments, and extra whitespace
      const cleaned = llmResponse
        .trim()
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .replace(/\/\/.*$/gm, "") // Remove // comments
        .replace(/\/\*[\s\S]*?\*\//g, ""); // Remove /* */ comments

      const classification: IntentClassification = JSON.parse(cleaned);

      this.logger.log(
        `Classification complete: ${JSON.stringify(classification, null, 2)}`
      );

      return classification;
    } catch (error) {
      this.logger.error(`Failed to classify message: ${error.message}`);

      return {
        isPokemonRelated: true,
        requiredEndpoints: [],
        reasoning: "Classification failed, assuming Pokemon-related",
      };
    }
  }
}
