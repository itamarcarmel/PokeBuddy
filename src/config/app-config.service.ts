import { Injectable, Logger } from "@nestjs/common";
import { ConfigService as NestConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";

interface AppConfig {
  name: string;
  version: string;
  description: string;
}

interface PokemonConfig {
  maxTeamSize: number;
  defaultGeneration: number;
  supportedGenerations: number[];
}

interface LLMConfig {
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
}

interface APIConfig {
  timeout: number;
  retries: number;
  retryDelay: number;
}

interface JsonConfig {
  app: AppConfig;
  pokemon: PokemonConfig;
  llm: LLMConfig;
  api: APIConfig;
}

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);
  private jsonConfig: JsonConfig;

  constructor(private nestConfigService: NestConfigService) {
    this.loadJsonConfig();
  }

  private loadJsonConfig(): void {
    try {
      const configPath = path.join(process.cwd(), "config.json");
      const configFile = fs.readFileSync(configPath, "utf-8");
      this.jsonConfig = JSON.parse(configFile);
    } catch (error) {
      this.logger.error(`Failed to load config.json: ${error.message}`);
      // Provide default configuration
      this.jsonConfig = {
        app: {
          name: "PokeBuddy",
          version: "1.0.0",
          description: "Pokemon Assistant",
        },
        pokemon: {
          maxTeamSize: 6,
          defaultGeneration: 1,
          supportedGenerations: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        },
        llm: {
          maxTokens: 1000,
          temperature: 0.7,
          systemPrompt: "You are a Pokemon expert assistant.",
        },
        api: {
          timeout: 10000,
          retries: 3,
          retryDelay: 1000,
        },
      };
    }
  }

  // Environment variables (from .env)
  get port(): number {
    return this.nestConfigService.get<number>("PORT") || 3000;
  }

  get nodeEnv(): string {
    return this.nestConfigService.get<string>("NODE_ENV") || "development";
  }

  get dbPath(): string {
    return this.nestConfigService.get<string>("DB_PATH") || "./data/pokebuddy.sqlite";
  }

  get pokeApiBaseUrl(): string {
    return (
      this.nestConfigService.get<string>("POKEAPI_BASE_URL") ||
      "https://pokeapi.co/api/v2"
    );
  }

  get pokedexApiBaseUrl(): string {
    return (
      this.nestConfigService.get<string>("POKEDEXAPI_BASE_URL") ||
      "https://pokedexapi.com"
    );
  }

  get groqApiKey(): string {
    return this.nestConfigService.get<string>("GROQ_API_KEY") || "";
  }

  get groqApiUrl(): string {
    return (
      this.nestConfigService.get<string>("GROQ_API_URL") ||
      "https://api.groq.com/openai/v1"
    );
  }

  get groqModel(): string {
    return this.nestConfigService.get<string>("GROQ_MODEL") || "llama-3.1-8b-instant";
  }

  // LLM Provider Selection
  get llmProvider(): "groq" | "openrouter" {
    const provider = this.nestConfigService.get<string>("LLM_PROVIDER", "groq");
    if (provider !== "groq" && provider !== "openrouter") {
      this.logger.warn(`Invalid LLM_PROVIDER: ${provider}, defaulting to groq`);
      return "groq";
    }
    return provider as "groq" | "openrouter";
  }

  // OpenRouter Configuration
  get openRouterApiKey(): string {
    return this.nestConfigService.get<string>("OPENROUTER_API_KEY") || "";
  }

  get openRouterApiUrl(): string {
    return (
      this.nestConfigService.get<string>("OPENROUTER_API_URL") ||
      "https://openrouter.ai/api/v1"
    );
  }

  get openRouterModel(): string {
    return (
      this.nestConfigService.get<string>("OPENROUTER_MODEL") ||
      "anthropic/claude-3.5-sonnet"
    );
  }

  get openRouterAppName(): string {
    return this.nestConfigService.get<string>("OPENROUTER_APP_NAME") || "PokeBuddy";
  }

  get cacheTtlHours(): number {
    return this.nestConfigService.get<number>("CACHE_TTL_HOURS") || 24;
  }

  get apiRateLimit(): number {
    return this.nestConfigService.get<number>("API_RATE_LIMIT") || 100;
  }

  get apiRateWindowMs(): number {
    return this.nestConfigService.get<number>("API_RATE_WINDOW_MS") || 60000;
  }

  // JSON configuration getters
  get app(): AppConfig {
    return this.jsonConfig.app;
  }

  get pokemon(): PokemonConfig {
    return this.jsonConfig.pokemon;
  }

  get llm(): LLMConfig {
    return this.jsonConfig.llm;
  }

  get api(): APIConfig {
    return this.jsonConfig.api;
  }

  // Utility methods
  isDevelopment(): boolean {
    return this.nodeEnv === "development";
  }

  isProduction(): boolean {
    return this.nodeEnv === "production";
  }
}
