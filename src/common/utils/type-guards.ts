import { ConversationSummary } from "../../modules/chat/conversation/interfaces/conversation-context.interface";

/**
 * Type guard to check if a value is a valid ConversationSummary
 */
export function isConversationSummary(value: any): value is ConversationSummary {
  return (
    value &&
    typeof value === "object" &&
    Array.isArray(value.pokemonDiscussed) &&
    Array.isArray(value.topicsCovered) &&
    typeof value.lastKnownContext === "string"
  );
}

/**
 * Safe JSON parse with type guard
 */
export function parseConversationSummary(json: string): ConversationSummary | null {
  try {
    const parsed = JSON.parse(json);
    return isConversationSummary(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Type guard for checking if a value is a valid object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Type guard for checking if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Type guard for checking if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}
