// Constants for summary generation
export const SUMMARY_TRIGGER_FIRST = 5;
export const SUMMARY_TRIGGER_INTERVAL = 10;
export const SUMMARY_MAX_TOKENS = 300;

// Constants for message validation
export const MESSAGE_MIN_LENGTH = 1;
export const MESSAGE_MAX_LENGTH = 2000;

// Constants for API timeouts
export const API_DEFAULT_TIMEOUT = 60000; // 60 seconds
export const API_RETRY_ATTEMPTS = 3;
export const API_RETRY_DELAY = 1000; // 1 second

// Constants for conversation history
export const CONVERSATION_RECENT_MESSAGES_LIMIT = 10;
export const CONVERSATION_SUMMARY_PREVIEW_LENGTH = 200;

// Constants for LLM
export const LLM_DEFAULT_TEMPERATURE = 0.7;
export const LLM_DEFAULT_MAX_TOKENS = 1000;
export const LLM_TEST_MAX_TOKENS = 5;

// Constants for logging
export const LOG_TRUNCATE_LENGTH = 300;
export const LOG_PROMPT_PREVIEW_LENGTH = 200;
