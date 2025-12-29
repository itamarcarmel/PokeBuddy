import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/typeorm";
import { Connection } from "typeorm";
import { ChatSessionService } from "./session/chat-session.service";
import { ConversationManagerService } from "./conversation/conversation-manager.service";
import { ChatOrchestrationService } from "./core/chat-orchestration.service";
import { ChatDto, ChatResponse } from "./dto/chat.dto";
import { Conversation } from "../../database/entities/conversation.entity";
import { ChatSession } from "../../database/entities/chat-session.entity";

/**
 * ChatService - Public API Facade
 *
 * Acts as the main entry point for chat functionality.
 * Delegates business logic to ChatOrchestrationService.
 * Provides convenience methods for session and conversation management.
 */
@Injectable()
export class ChatService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly chatOrchestration: ChatOrchestrationService,
    private readonly sessionService: ChatSessionService,
    private readonly conversationManager: ConversationManagerService
  ) {}

  /**
   * Main chat endpoint - delegates to orchestration service
   * Uses database transaction to ensure data consistency
   */
  async chat(chatDto: ChatDto): Promise<ChatResponse> {
    const session = await this.sessionService.getChatSession(chatDto.chatSessionId);

    if (!session) {
      throw new Error(`Session with ID ${chatDto.chatSessionId} not found`);
    }

    const recentMessages = await this.conversationManager.getRecentMessages(
      chatDto.chatSessionId
    );

    // Process chat
    const result = await this.chatOrchestration.processChat(
      chatDto,
      session,
      recentMessages
    );

    // Increment message count and save conversation in transaction if successful
    if (!result.error) {
      await this.connection.transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager.increment(
          ChatSession,
          { id: session.id },
          "messageCount",
          1
        );

        const conversation = transactionalEntityManager.create(Conversation, {
          chatSessionId: session.id,
          chatSession: session,
          message: chatDto.message,
          response: result.response,
          context: chatDto.context ? JSON.stringify(chatDto.context) : undefined,
        });

        await transactionalEntityManager.save(conversation);
      });
    }

    return result;
  }

  // Chat Session Management Methods - Delegate to ChatSessionService

  async getAllChatSessions(): Promise<ChatSession[]> {
    return this.sessionService.getAllChatSessions();
  }

  async createChatSession(): Promise<ChatSession> {
    return this.sessionService.createChatSession();
  }

  async getChatSession(sessionId: number): Promise<ChatSession | null> {
    return this.sessionService.getChatSession(sessionId);
  }

  async getChatSessionHistory(sessionId: number): Promise<Conversation[]> {
    return this.conversationManager.getConversations({
      sessionId,
      order: "ASC",
    });
  }
}
