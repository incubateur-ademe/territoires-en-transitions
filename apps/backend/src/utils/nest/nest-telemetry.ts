import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { context, Span, SpanStatusCode, trace } from '@opentelemetry/api';
import type { Request } from 'express';
import { defer, finalize, Observable, tap } from 'rxjs';

const tracer = trace.getTracer('@tet/nest');

function recordError(span: Span, error: unknown): void {
  const exception = error instanceof Error ? error : String(error);
  span.recordException(exception);
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error instanceof Error ? error.message : String(error),
  });
}

export async function traceNestBootstrap<T>(
  moduleName: string,
  createApplication: () => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(
    'Create Nest App',
    {
      attributes: {
        component: '@nestjs/core',
        'nestjs.type': 'app_creation',
        'nestjs.module': moduleName,
      },
    },
    async (span) => {
      try {
        return await createApplication();
      } catch (error) {
        recordError(span, error);
        throw error;
      } finally {
        span.end();
      }
    }
  );
}

/**
 * Trace les contrôleurs dans le contexte OTEL de la requête HTTP.
 * Les refus des guards, exécutés avant les interceptors, restent dans la span HTTP.
 */
export class NestTelemetryInterceptor implements NestInterceptor {
  intercept(
    execution: ExecutionContext,
    next: CallHandler
  ): Observable<unknown> {
    if (execution.getType() !== 'http') {
      return next.handle();
    }

    const parentContext = context.active();
    const controller = execution.getClass().name;
    const handler = execution.getHandler().name;
    const request = execution.switchToHttp().getRequest<Request>();

    return new Observable((subscriber) => {
      const span = tracer.startSpan(
        `${controller}.${handler}`,
        {
          attributes: {
            component: '@nestjs/core',
            'nestjs.type': 'request_context',
            'nestjs.controller': controller,
            'nestjs.callback': handler,
            'http.request.method': request.method,
            'http.route': request.route?.path,
          },
        },
        parentContext
      );
      return context.with(trace.setSpan(parentContext, span), () =>
        defer(() => next.handle())
          .pipe(
            tap({ error: (error: unknown) => recordError(span, error) }),
            finalize(() => span.end())
          )
          .subscribe(subscriber)
      );
    });
  }
}
