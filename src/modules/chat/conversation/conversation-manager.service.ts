import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Conversation } from "../../../database/entities/conversation.entity";
import { Logger } from "@nestjs/common";
import { ConversationMessage } from "./interfaces/conversation-context.interface";

/**
 * ConversationManagerService
 *
 * Handles conversation persistence and context building
 */
@Injectable()
export class ConversationManagerService {
  private readonly logger = new Logger(ConversationManagerService.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>
  ) {}

  /**
   * Save a conversation to the database
   */
  async saveConversation(
    chatSessionId: number,
    message: string,
    response: string,
    context?: any
  ): Promise<Conversation> {
    const conversation = this.conversationRepository.create({
      chatSessionId,
      message,
      response,
      context: context ? JSON.stringify(context) : undefined,
    });

    return this.conversationRepository.save(conversation);
  }

  /**
   * Get recent messages for a chat session
   * Returns recent 3 conversation pairs (6 messages total)
   */
  async getRecentMessages(chatSessionId: number): Promise<ConversationMessage[]> {
    try {
      // Get recent 3 conversations (6 messages: 3 pairs of user + assistant)
      const recentConversations = await this.conversationRepository.find({
        where: { chatSessionId },
        order: { timestamp: "DESC" },
        take: 3,
      });

      // Convert to ConversationMessage format (reverse to chronological order)
      const recentMessages: ConversationMessage[] = recentConversations
        .reverse()
        .flatMap((conv) => [
          { role: "user", content: conv.message },
          { role: "assistant", content: conv.response },
        ]);

      return recentMessages;
    } catch (error) {
      this.logger.error(`Error getting recent messages: ${error.message}`);
      return [];
    }
  }

  /**
   * Get conversations with optional filtering by session
   * @param options.sessionId - Optional session ID to filter by
   * @param options.limit - Maximum number of conversations to return
   * @param options.order - Sort order: 'ASC' or 'DESC' (default: 'DESC')
   */
  async getConversations(options?: {
    sessionId?: number;
    limit?: number;
    order?: "ASC" | "DESC";
  }): Promise<Conversation[]> {
    const { sessionId, limit, order = "DESC" } = options || {};

    return this.conversationRepository.find({
      where: sessionId ? { chatSessionId: sessionId } : undefined,
      order: { timestamp: order },
      take: limit,
    });
  }
}
