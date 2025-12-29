/**
 * Core LLM Provider Interface
 *
 * Defines the contract that all LLM providers must implement.
 * Supports multiple providers (Groq, OpenRouter, etc.) with load-time selection.
 */

export interface LlmProvider {
  /**
   * Generate text completion from prompt
   * @param prompt The user's input prompt
   * @param systemPrompt Optional system prompt (uses default if not provided)
   * @returns The generated text response
   */
  generate(prompt: string, systemPrompt?: string): Promise<string>;

  /**
   * Test connection to LLM provider
   * @returns True if connection is successful, false otherwise
   */
  checkConnection(): Promise<boolean>;

  /**
   * Get provider name for logging and debugging
   * @returns The name of the provider (e.g., "Groq", "OpenRouter")
   */
  getProviderName(): string;
}

/**
 * Configuration for LLM provider
 */
export interface LlmProviderConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  systemPrompt: string;
}
