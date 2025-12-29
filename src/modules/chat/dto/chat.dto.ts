import {
  IsString,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from "class-validator";

export class ChatDto {
  @IsNotEmpty({ message: "Message is required" })
  @IsString()
  @MinLength(1, { message: "Message cannot be empty" })
  @MaxLength(2000, { message: "Message is too long (max 2000 characters)" })
  message: string;

  @IsNotEmpty({ message: "Chat session ID is required" })
  @IsNumber()
  chatSessionId: number;

  @IsOptional()
  context?: any;
}

/**
 * Response structure from chat processing
 */
export interface ChatResponse {
  message: string;
  response: string;
  chatSessionId: number;
  timestamp: Date;
  error?: boolean;
  debug?: {
    resourcesUsed: Array<{
      source: string;
      parameter: string;
      responseTime: number; // milliseconds
    }>;
    llm: {
      connected: boolean;
      provider: string;
      model: string;
    };
    classification: {
      isPokemonRelated: boolean;
      isBattleSimulation: boolean;
      endpointsCount: number;
      processingTime: number; // milliseconds
    };
    timing: {
      classification: number; // milliseconds
      apiFetch: number; // milliseconds
      llmGeneration: number; // milliseconds
      total: number; // milliseconds
    };
    apiDataFetched?: boolean;
  };
}
