import { Injectable } from "@nestjs/common";
import { Logger } from "@nestjs/common";
import { LlmService } from "../../llm/llm.service";
import { ChatSessionService } from "../session/chat-session.service";
import { ConversationManagerService } from "../conversation/conversation-manager.service";
import { CONVERSATION_SUMMARY_PROMPT } from "./prompts/pokemon-prompts";
import { ConversationSummary } from "../conversation/interfaces/conversation-context.interface";
import {
  SUMMARY_TRIGGER_FIRST,
  SUMMARY_TRIGGER_INTERVAL,
  CONVERSATION_SUMMARY_PREVIEW_LENGTH,
} from "../../../common/constants/app.constants";

/**
 * SummaryService
 *
 * Handles conversation summarization logic:
 * - Determining when summaries should be triggered
 * - Generating summaries using LLM
 * - Updating session with summary
 */
@Injectable()
export class SummaryService {
  private readonly logger = new Logger(SummaryService.name);

  constructor(
    private readonly sessionService: ChatSessionService,
    private readonly conversationManager: ConversationManagerService,
    private readonly llmService: LlmService
  ) {}

  /**
   * Generate a conversation summary using LLM
   */
  private async generateConversationSummary(
    chatSessionId: number
  ): Promise<ConversationSummary | null> {
    try {
      // Get all conversations for the session
      const conversations = await this.conversationManager.getConversations({
        sessionId: chatSessionId,
        order: "ASC",
      });

      if (conversations.length === 0) {
        return null;
      }

      // Build conversation history string
      const conversationHistory = conversations
        .map(
          (conv) =>
            `User: ${conv.message}\nAssistant: ${conv.response.substring(
              0,
              CONVERSATION_SUMMARY_PREVIEW_LENGTH
            )}...`
        )
        .join("\n\n");

      // Generate summary using LLM
      const summaryPrompt = CONVERSATION_SUMMARY_PROMPT.replace(
        "{conversationHistory}",
        conversationHistory
      );

      const summaryResponse = await this.llmService.generate(
        summaryPrompt,
        "You are a conversation summarizer. Generate only valid JSON."
      );

      // Parse JSON response
      const summary: ConversationSummary = JSON.parse(summaryResponse.trim());

      this.logger.log(
        `✅ Generated summary for session ${chatSessionId}: ${summary.pokemonDiscussed.length} Pokemon, ${summary.topicsCovered.length} topics`
      );

      return summary;
    } catch (error) {
      this.logger.error(`Failed to generate summary: ${error.message}`);
      return null;
    }
  }

  /**
   * Update session with new summary
   */
  private async updateSessionSummary(
    sessionId: number,
    summary: string
  ): Promise<void> {
    await this.sessionService.updateSessionSummary(sessionId, summary);
  }

  /**
   * Generate and update summary for a session if needed
   * Only generates summary at 5th message, then every 10 messages (15th, 20th, etc.)
   */
  async generateAndUpdateSummary(chatSessionId: number): Promise<void> {
    try {
      // Check if summary should be triggered
      const session = await this.sessionService.getChatSession(chatSessionId);

      if (!session) {
        this.logger.warn(`Session ${chatSessionId} not found, skipping summary`);
        return;
      }

      const shouldTrigger =
        session.messageCount === SUMMARY_TRIGGER_FIRST ||
        session.messageCount % SUMMARY_TRIGGER_INTERVAL === 0;

      if (!shouldTrigger) {
        return;
      }

      // Generate summary
      const summary = await this.generateConversationSummary(chatSessionId);

      if (summary) {
        await this.updateSessionSummary(chatSessionId, JSON.stringify(summary));

        this.logger.log(`✅ Updated conversation summary for session ${chatSessionId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to update conversation summary: ${error.message}`);
    }
  }
}
