



import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UsageService } from './usage.service.js';

@Injectable()
export class UsageInterceptor implements NestInterceptor {
  constructor(private usageService: UsageService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          const statusCode = context.switchToHttp().getResponse().statusCode;

          this.usageService
            .log({
              userId: request.user?.sub,
              endpoint: request.url,
              method: request.method,
              statusCode,
              durationMs: duration,
            })
            .catch(() => {});
        },
        error: (error) => {
          const duration = Date.now() - start;

          this.usageService
            .log({
              userId: request.user?.sub,
              endpoint: request.url,
              method: request.method,
              statusCode: error.status || 500,
              durationMs: duration,
            })
            .catch(() => {});
        },
      }),
    );
  }
}