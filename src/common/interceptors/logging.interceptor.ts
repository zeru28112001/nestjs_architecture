import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    this.logger.log(`➡️ [${method}] ${url} - Request Started`);

    return next.handle().pipe(
      tap({
        next: () => {
          const statusCode = context.switchToHttp().getResponse().statusCode;
          const duration = Date.now() - startTime;
          this.logger.log(
            `[${method}] ${url} - ${statusCode} (${duration}ms) - ${userAgent}`,
          );
        },
        error: (err: any) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `[${method}] ${url} - ERROR (${duration}ms) - ${err?.message ?? 'Unknown error'}`,
          );
        },
      }),
    );
  }
}

