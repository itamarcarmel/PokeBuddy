import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppConfigService } from "../config/app-config.service";
import * as path from "path";
import * as fs from "fs";
import { Conversation, ChatSession } from "./entities";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => {
        const dbPath = configService.dbPath;
        const dbDir = path.dirname(dbPath);

        // Create data directory if it doesn't exist
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }

        return {
          type: "sqlite",
          database: dbPath,
          entities: [Conversation, ChatSession],
          synchronize: true, // Auto-create tables (disable in production)
          logging: false, // Disable SQL query logging
        };
      },
    }),
  ],
})
export class DatabaseModule {}
