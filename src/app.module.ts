import { Module } from "@nestjs/common";
import { ConfigModule } from "./config/config.module";
import { DatabaseModule } from "./database/database.module";
import { PokemonModule } from "./modules/pokemon/pokemon.module";
import { ChatModule } from "./modules/chat/chat.module";
import { LlmModule } from "./modules/llm/llm.module";
import { ExternalApiModule } from "./modules/external-api/external-api.module";
import { CommonModule } from "./common/common.module";

@Module({
  imports: [
    CommonModule,
    ConfigModule,
    DatabaseModule,
    ExternalApiModule,
    LlmModule,
    PokemonModule,
    ChatModule,
  ],
})
export class AppModule {}
