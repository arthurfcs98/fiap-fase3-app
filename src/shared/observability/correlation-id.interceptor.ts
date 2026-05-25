import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { Observable } from 'rxjs';

interface CorrelationContext {
  correlationId: string;
}

export const correlationStorage = new AsyncLocalStorage<CorrelationContext>();

export const getCorrelationId = (): string | undefined =>
  correlationStorage.getStore()?.correlationId;

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const res = ctx.switchToHttp().getResponse<{
      setHeader: (k: string, v: string) => void;
    }>();

    const incoming =
      (req.headers['x-correlation-id'] as string | undefined) ??
      (req.headers['X-Correlation-Id'] as string | undefined);
    const cid = incoming && typeof incoming === 'string' ? incoming : randomUUID();

    req.headers['x-correlation-id'] = cid;
    res.setHeader('x-correlation-id', cid);

    return new Observable((subscriber) => {
      correlationStorage.run({ correlationId: cid }, () => {
        next.handle().subscribe({
          next: (v) => subscriber.next(v),
          error: (e) => subscriber.error(e),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
