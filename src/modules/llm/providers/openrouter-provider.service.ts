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

// OpenAI-compatible chat format (OpenRouter uses OpenAI API format)
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
 * OpenRouter LLM Provider Implementation
 *
 * Uses OpenRouter's unified API to access multiple LLM providers.
 * Supports models from OpenAI, Anthropic, Google, Meta, and more.
 *
 * Key differences from Groq:
 * - Requires HTTP-Referer and X-Title headers for attribution
 * - Model format: "provider/model" (e.g., "anthropic/claude-3.5-sonnet")
 * - Supports a wide variety of models through a single API
 */
@Injectable()
export class OpenRouterProvider implements LlmProvider {
  private readonly logger = new Logger(OpenRouterProvider.name);
  private axiosInstance: AxiosInstance;

  constructor(private configService: AppConfigService) {
    const apiKey = this.configService.openRouterApiKey;
    const appName = this.configService.openRouterAppName;

    this.axiosInstance = axios.create({
      baseURL: this.configService.openRouterApiUrl,
      timeout: API_DEFAULT_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // OpenRouter-specific headers for attribution and analytics
        "HTTP-Referer": "https://github.com/pokebuddy", // Optional: your app URL
        "X-Title": appName, // Optional: your app name
      },
    });

    this.logger.log(
      `OpenRouter Provider initialized with model: ${this.configService.openRouterModel}`
    );
  }

  getProviderName(): string {
    return "OpenRouter";
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
      this.logger.log("🤖 LLM REQUEST to OpenRouter API");
      this.logger.log(`Model: ${this.configService.openRouterModel}`);
      this.logger.log(
        `System Prompt: ${messages[0].content.substring(0, LOG_TRUNCATE_LENGTH / 3)}...`
      );
      this.logger.log(
        `User Prompt: ${messages[1].content.substring(0, LOG_PROMPT_PREVIEW_LENGTH)}...`
      );
      this.logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      const request: ChatCompletionRequest = {
        model: this.configService.openRouterModel,
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
        throw new Error("No response content from OpenRouter");
      }

      this.logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      this.logger.log("✅ LLM RESPONSE from OpenRouter API");
      this.logger.log(`Response: ${content.substring(0, LOG_TRUNCATE_LENGTH)}...`);
      this.logger.log(
        `Tokens Used: ${response.data.usage.total_tokens} (prompt: ${response.data.usage.prompt_tokens}, completion: ${response.data.usage.completion_tokens})`
      );
      this.logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      return content;
    } catch (error) {
      this.logger.error(`Failed to generate LLM response: ${error.message}`);

      // Log full error details for debugging
      if (error.response) {
        this.logger.error(`HTTP Status: ${error.response.status}`);
        this.logger.error(`Response Data: ${JSON.stringify(error.response.data)}`);
        this.logger.error(`Request URL: ${error.config?.baseURL}${error.config?.url}`);
      }

      if (error.response?.status === 401) {
        throw new Error(
          "Invalid OpenRouter API key. Please check your OPENROUTER_API_KEY in .env file"
        );
      }

      if (error.response?.status === 402) {
        throw new Error(
          "OpenRouter credits exhausted. Please add credits to your account"
        );
      }

      if (error.response?.status === 429) {
        throw new Error(
          "OpenRouter API rate limit exceeded. Please try again in a moment"
        );
      }

      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        throw new Error(
          "Could not connect to OpenRouter API at " +
            this.configService.openRouterApiUrl
        );
      }

      throw error;
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      // Check if API key is configured
      if (
        !this.configService.openRouterApiKey ||
        this.configService.openRouterApiKey === "your-openrouter-api-key-here"
      ) {
        this.logger.warn("OpenRouter API key not configured");
        return false;
      }

      this.logger.log(`Testing OpenRouter API connection...`);

      // Try a minimal chat completion to verify the key works
      const testRequest: ChatCompletionRequest = {
        model: this.configService.openRouterModel,
        messages: [{ role: "user", content: "test" }],
        max_tokens: LLM_TEST_MAX_TOKENS,
        stream: false,
      };

      await this.axiosInstance.post("/chat/completions", testRequest);
      this.logger.log("✅ OpenRouter API connection successful!");
      return true;
    } catch (error) {
      this.logger.warn(`OpenRouter API not available: ${error.message}`);
      if (error.response) {
        this.logger.error(`HTTP Status: ${error.response.status}`);
        if (error.response.data) {
          this.logger.error(`Error details: ${JSON.stringify(error.response.data)}`);
        }
      }
      return false;
    }
  }
}
