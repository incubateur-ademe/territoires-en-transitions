import {
  getErrorMessage,
  getErrorWithCode,
} from '@/backend/utils/nest/errors.utils';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { ApiUsageEnum } from '../api/api-usage-type.enum';
import { ApiUsage } from '../api/api-usage.decorator';
import { ContextStoreService } from '../context/context.service';
import { PostHogService } from './posthog.service';

@Injectable()
export class PostHogApiInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PostHogApiInterceptor.name);

  constructor(
    private readonly contextStoreService: ContextStoreService,
    private readonly reflector: Reflector,
    private readonly posthogService: PostHogService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!this.posthogService.isEnabled()) {
      return next.handle();
    }

    const request: Request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    const apiUsage = this.reflector.get(ApiUsage, context.getHandler());
    const isExternalApi = apiUsage?.includes(ApiUsageEnum.EXTERNAL_API);

    // We only track external APIs for now
    if (!isExternalApi) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: () => {
          this.trackApiCall(request, response, startTime, null);
        },
        error: (error) => {
          this.trackApiCall(request, response, startTime, error);
        },
      })
    );
  }

  private trackApiCall(
    request: Request,
    response: Response,
    startTime: number,
    error: unknown = null
  ) {
    try {
      const context = this.contextStoreService.getContext();
      const duration = Date.now() - startTime;

      const properties = {
        method: request.method,
        path: request.path,
        url: request.url,
        accept: request.get('Accept'),
        content_type: request.get('Content-Type'),

        duration_ms: duration,
        status_code: response.statusCode,

        user_agent: request.get('User-Agent'),
        ip: request.ip,

        service: context.service,
        version: context.version,
        environment: context.environment,

        user_id: context.userId,
        auth_role: context.authRole,
        api_client_id: context.apiClientId,
        service_account_id: context.serviceAccountId,

        collectivite_id: context.scope?.collectiviteId,
        referentiel_id: context.scope?.referentielId,

        ...(error
          ? {
              error_code: getErrorWithCode(error).code,
              error_message: getErrorMessage(error),
            }
          : {}),
      };

      const distinctId =
        context.userId || context.apiClientId || request.ip || 'anonymous';

      const eventName = this.getEventName(request.path, request.method);

      this.posthogService.capture({
        distinctId,
        event: eventName,
        properties,
      });

      this.logger.log(`Appel API tracké : ${eventName}`, {
        path: request.path,
        duration,
        statusCode: response.statusCode,
        userId: context.userId,
      });
    } catch (trackingError) {
      this.logger.error(
        "Erreur lors du tracking de l'appel API",
        trackingError
      );
    }
  }

  private getEventName(path: string, method: string): string {
    const normalizedPath = path
      .replace('/api/v1/', '')
      .replace(/\/\d+/g, '/:id')
      .replace(/[^\w/:-]/g, '_');

    return `api_${method.toLowerCase()}_${normalizedPath}`;
  }
}
