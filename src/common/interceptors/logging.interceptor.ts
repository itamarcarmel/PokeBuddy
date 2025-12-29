import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, traceId } = request;
    const startTime = Date.now();

    this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    this.logger.log(`🔵 INCOMING REQUEST [${traceId}]`);
    this.logger.log(`Method: ${method} ${url}`);
    if (method === "POST" || method === "PUT" || method === "PATCH") {
      this.logger.log(`Body: ${JSON.stringify(body).substring(0, 200)}`);
    }
    this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          this.logger.log(`🟢 REQUEST COMPLETED [${traceId}]`);
          this.logger.log(`Duration: ${duration}ms`);
          this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
          );
          this.logger.error(`🔴 REQUEST FAILED [${traceId}]`);
          this.logger.error(`Duration: ${duration}ms`);
          this.logger.error(`Error: ${error.message}`);
          this.logger.error(
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
          );
        },
      })
    );
  }
}
