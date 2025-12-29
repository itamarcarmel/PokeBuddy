import { Injectable, Logger } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";
import { LlmProvider } from "../interfaces/llm-provider.interface";
import { AppConfigService } from "../../../config/app-config.service";
import {
  API_DEFAULT_TIMEOUT,
  LLM_TEST_MAX_TOKENS,
  LOG_TRUNCATE_LENGTH,
  LOG_PROMPT_PREVIEW_LENGTH,
} from "../../../common/constants/app.constants";

// OpenAI-compatible chat format (Groq uses OpenAI API format)
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Groq LLM Provider Implementation
 *
 * Uses Groq's OpenAI-compatible API for fast inference.
 * Optimized for speed with models like llama-3.3-70b-versatile.
 */
@Injectable()
export class GroqProvider implements LlmProvider {
  private readonly logger = new Logger(GroqProvider.name);
  private axiosInstance: AxiosInstance;

  constructor(private configService: AppConfigService) {
    const apiKey = this.configService.groqApiKey;

    this.axiosInstance = axios.create({
      baseURL: this.configService.groqApiUrl,
      timeout: API_DEFAULT_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    this.logger.log(
      `Groq Provider initialized with model: ${this.configService.groqModel}`
    );
  }

  getProviderName(): string {
    return "Groq";
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const messages: ChatMessage[] = [
        {
          role: "system",
          content: systemPrompt || this.configService.llm.systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ];

      this.logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      this.logger.log("🤖 LLM REQUEST to Groq API");
      this.logger.log(`Model: ${this.configService.groqModel}`);
      this.logger.log(
        `System Prompt: ${messages[0].content.substring(0, LOG_TRUNCATE_LENGTH / 3)}...`
      );
      this.logger.log(
        `User Prompt: ${messages[1].content.substring(0, LOG_PROMPT_PREVIEW_LENGTH)}...`
      );
      this.logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      const request: ChatCompletionRequest = {
        model: this.configService.groqModel,
        messages,
        temperature: this.configService.llm.temperature,
        max_tokens: this.configService.llm.maxTokens,
        stream: false,
      };

      const response = await this.axiosInstance.post<ChatCompletionResponse>(
        "/chat/completions",
        request
      );

      const content = response.data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("No response content from Groq");
      }

      this.logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      this.logger.log("✅ LLM RESPONSE from Groq API");
      this.logger.log(`Response: ${content.substring(0, LOG_TRUNCATE_LENGTH)}...`);
      this.logger.log(
        `Tokens Used: ${response.data.usage.total_tokens} (prompt: ${response.data.usage.prompt_tokens}, completion: ${response.data.usage.completion_tokens})`
      );
      this.logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      return content;
    } catch (error) {
      this.logger.error(`Failed to generate LLM response: ${error.message}`);

      if (error.response?.status === 401) {
        throw new Error(
          "Invalid Groq API key. Please check your GROQ_API_KEY in .env file"
        );
      }

      if (error.response?.status === 429) {
        throw new Error("Groq API rate limit exceeded. Please try again in a moment");
      }

      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        throw new Error(
          "Could not connect to Groq API at " + this.configService.groqApiUrl
        );
      }

      throw error;
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      // Check if API key is configured
      if (
        !this.configService.groqApiKey ||
        this.configService.groqApiKey === "your-groq-api-key-here"
      ) {
        this.logger.warn("Groq API key not configured");
        return false;
      }

      this.logger.log(`Testing Groq API connection...`);

      // Try a minimal chat completion to verify the key works
      const testRequest: ChatCompletionRequest = {
        model: this.configService.groqModel,
        messages: [{ role: "user", content: "test" }],
        max_tokens: LLM_TEST_MAX_TOKENS,
        stream: false,
      };

      await this.axiosInstance.post("/chat/completions", testRequest);
      this.logger.log("✅ Groq API connection successful!");
      return true;
    } catch (error) {
      this.logger.warn(`Groq API not available: ${error.message}`);
      if (error.response) {
        this.logger.error(`HTTP Status: ${error.response.status}`);
      }
      return false;
    }
  }
}
