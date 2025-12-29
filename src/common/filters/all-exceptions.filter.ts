import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AppError, ErrorCode } from "../errors/app-error";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let code = ErrorCode.INTERNAL_ERROR;
    let details: any = undefined;

    // Handle AppError (custom errors)
    if (exception instanceof AppError) {
      status = exception.statusCode;
      message = exception.message;
      code = exception.code;
      details = exception.details;
    }
    // Handle NestJS HttpException
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === "object") {
        message = (exceptionResponse as any).message || exception.message;
        details = exceptionResponse;
      }
    }
    // Handle generic errors
    else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log error
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - ${message}`,
      exception instanceof Error ? exception.stack : ""
    );

    // Send response
    response.status(status).json({
      success: false,
      statusCode: status,
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    });
  }
}
