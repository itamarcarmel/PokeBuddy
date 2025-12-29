import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SessionController, LlmStatusController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { MessageIntentClassifierService } from "./llm-integration/message-intent-classifier.service";
import { ChatSessionService } from "./session/chat-session.service";
import { ConversationManagerService } from "./conversation/conversation-manager.service";
import { ApiDataFetcherService } from "./api-integration/api-data-fetcher.service";
import { SummaryService } from "./llm-integration/summary.service";
import { ChatOrchestrationService } from "./core/chat-orchestration.service";
import { PokemonResponseGeneratorService } from "./llm-integration/pokemon-response-generator.service";
import { Conversation } from "../../database/entities/conversation.entity";
import { ChatSession } from "../../database/entities/chat-session.entity";
import { LlmModule } from "../llm/llm.module";
import { PokemonModule } from "../pokemon/pokemon.module";
import { ExternalApiModule } from "../external-api/external-api.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, ChatSession]),
    LlmModule,
    PokemonModule,
    ExternalApiModule,
  ],
  controllers: [SessionController, LlmStatusController],
  providers: [
    ChatService,
    ChatOrchestrationService,
    PokemonResponseGeneratorService,
    ChatSessionService,
    ConversationManagerService,
    ApiDataFetcherService,
    SummaryService,
    MessageIntentClassifierService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
