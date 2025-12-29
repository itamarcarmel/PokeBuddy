/**
 * Conversation Context Interface
 *
 * Provides compressed context for LLM to maintain conversation continuity
 * without passing entire message history.
 */

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ConversationSummary {
  pokemonDiscussed: string[]; // Pokemon mentioned in conversation
  topicsCovered: string[]; // Topics like "evolution", "abilities", "stats"
  lastKnownContext: string; // Brief description of current conversation state
}

export interface ConversationContext {
  recentMessages: ConversationMessage[]; // Last 3-5 message pairs
  summary?: ConversationSummary; // Compressed summary of older messages
}
