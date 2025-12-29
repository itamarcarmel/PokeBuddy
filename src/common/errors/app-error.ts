/**
 * Application Error Types
 */
export enum ErrorCode {
  // Validation Errors (400)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",

  // Not Found (404)
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
  POKEMON_NOT_FOUND = "POKEMON_NOT_FOUND",

  // External API Errors (502/503)
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
  POKEAPI_ERROR = "POKEAPI_ERROR",
  LLM_API_ERROR = "LLM_API_ERROR",

  // Database Errors (500)
  DATABASE_ERROR = "DATABASE_ERROR",
  TRANSACTION_FAILED = "TRANSACTION_FAILED",

  // Business Logic Errors (422)
  BUSINESS_LOGIC_ERROR = "BUSINESS_LOGIC_ERROR",
  INVALID_OPERATION = "INVALID_OPERATION",

  // Internal Errors (500)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Base Application Error
 */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with ID '${identifier}' not found`
      : `${resource} not found`;
    super(ErrorCode.RESOURCE_NOT_FOUND, message, 404);
  }
}

/**
 * External API Error (502)
 */
export class ExternalApiError extends AppError {
  constructor(service: string, message: string, details?: any) {
    super(
      ErrorCode.EXTERNAL_API_ERROR,
      `External API error from ${service}: ${message}`,
      502,
      details
    );
  }
}

/**
 * Database Error (500)
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.DATABASE_ERROR, message, 500, details);
  }
}

/**
 * Business Logic Error (422)
 */
export class BusinessLogicError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.BUSINESS_LOGIC_ERROR, message, 422, details);
  }
}
