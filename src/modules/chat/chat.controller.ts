import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Param,
  ParseIntPipe,
} from "@nestjs/common";
import { ChatService } from "./chat.service";
import { ChatDto } from "./dto/chat.dto";
import { LlmService } from "../llm/llm.service";

/**
 * ChatController - RESTful API for PokeBuddy Chat
 *
 * Resource Structure:
 * - /api/sessions          → Chat sessions (collection)
 * - /api/sessions/:id      → Specific session
 * - /api/sessions/:id/messages → Messages within a session
 * - /api/llm/status        → LLM service status
 */

// Session Management
@Controller("api/sessions")
export class SessionController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * GET /api/sessions
   * Get all chat sessions
   */
  @Get()
  getAllSessions() {
    return this.chatService.getAllChatSessions();
  }

  /**
   * POST /api/sessions
   * Create a new chat session
   */
  @Post()
  createSession() {
    return this.chatService.createChatSession();
  }

  /**
   * GET /api/sessions/:id
   * Get a specific session by ID
   */
  @Get(":id")
  getSession(@Param("id", ParseIntPipe) id: number) {
    return this.chatService.getChatSession(id);
  }

  /**
   * POST /api/sessions/:id/messages
   * Send a message in a session (creates conversation)
   */
  @Post(":id/messages")
  sendMessage(
    @Param("id", ParseIntPipe) sessionId: number,
    @Body() body: { message: string; context?: any }
  ) {
    const chatDto: ChatDto = {
      chatSessionId: sessionId,
      message: body.message,
      context: body.context,
    };
    return this.chatService.chat(chatDto);
  }

  /**
   * GET /api/sessions/:id/messages
   * Get message history for a specific session
   */
  @Get(":id/messages")
  getSessionMessages(@Param("id", ParseIntPipe) id: number) {
    return this.chatService.getChatSessionHistory(id);
  }
}

// LLM Service Status
@Controller("api/llm")
export class LlmStatusController {
  constructor(private readonly llmService: LlmService) {}

  /**
   * GET /api/llm/status
   * Check LLM service connection and available models
   */
  @Get("status")
  checkStatus() {
    return this.llmService.getStatus();
  }
}
