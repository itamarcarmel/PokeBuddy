import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChatSession } from "../../../database/entities/chat-session.entity";
import { Logger } from "@nestjs/common";

/**
 * ChatSessionService
 *
 * Handles all chat session-related operations:
 * - Session creation and retrieval
 * - Message count tracking
 * - Session lifecycle management
 */
@Injectable()
export class ChatSessionService {
  private readonly logger = new Logger(ChatSessionService.name);

  

  constructor(
    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>
  ) {}

  /**
   * Increment message count for a session
   */
  async incrementMessageCount(sessionId: number): Promise<void> {
    const session = await this.chatSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (session) {
      session.messageCount = (session.messageCount || 0) + 1;
      await this.chatSessionRepository.save(session);
    }
  }

  /**
   * Get all chat sessions ordered by most recent
   */
  async getAllChatSessions(): Promise<ChatSession[]> {
    return this.chatSessionRepository.find({
      order: { updatedAt: "DESC" },
      relations: ["conversations"],
    });
  }

  /**
   * Create a new chat session
   */
  async createChatSession(): Promise<ChatSession> {
    const session = this.chatSessionRepository.create({ isActive: true });
    return this.chatSessionRepository.save(session);
  }

  /**
   * Get chat session by ID with all conversations
   */
  async getChatSession(sessionId: number): Promise<ChatSession | null> {
    return this.chatSessionRepository.findOne({
      where: { id: sessionId },
      relations: ["conversations"],
      order: {
        conversations: {
          timestamp: "ASC",
        },
      },
    });
  }

  /**
   * Update session with new summary
   */
  async updateSessionSummary(
    sessionId: number,
    summary: string
  ): Promise<void> {
    await this.chatSessionRepository.update(sessionId, {
      conversationSummary: summary,
    });
  }
}


