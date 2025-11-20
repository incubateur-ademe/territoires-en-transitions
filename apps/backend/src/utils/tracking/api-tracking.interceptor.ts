import { getErrorCode } from '@tet/backend/utils/nest/errors.utils';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getErrorMessage } from '@tet/domain/utils';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { ApiUsageEnum } from '../api/api-usage-type.enum';
import { ApiUsage } from '../api/api-usage.decorator';
import { ContextStoreService } from '../context/context.service';
import { TrackingService } from './tracking.service';

@Injectable()
export class ApiTrackingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ApiTrackingInterceptor.name);

  constructor(
    private readonly contextStoreService: ContextStoreService,
    private readonly reflector: Reflector,
    private readonly trackingService: TrackingService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!this.trackingService.isEnabled()) {
      return next.handle();
    }

    // Only track external APIs for now
    const apiUsage = this.reflector.get(ApiUsage, context.getHandler());
    const isExternalApi = apiUsage?.includes(ApiUsageEnum.EXTERNAL_API);

    if (!isExternalApi) {
      return next.handle();
    }

    const request: Request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();
    const startTime = Date.now();

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
              error_code: getErrorCode(error),
              error_message: getErrorMessage(error),
            }
          : {}),
      };

      const distinctId =
        context.userId || context.apiClientId || request.ip || 'anonymous';

      const eventName = this.getEventName(request.path, request.method);

      this.trackingService.capture({
        distinctId,
        event: eventName,
        properties,
      });
    } catch (trackingError) {
      this.logger.error('Error tracking API call', trackingError);
    }
  }

  private getEventName(path: string, method: string): string {
    const normalizedPath = path
      // Remove API prefix
      // Ex: '/api/v1/collectivites' → 'collectivites'
      .replace('/api/v1/', '')
      // Replace all numeric IDs with ':id' to normalize routes
      // Ex: 'collectivites/123/actions/456' → 'collectivites/:id/actions/:id'
      .replace(/\/\d+/g, '/:id')
      // Replace all special characters (except letters, digits, /, :, -) with underscores
      // Ex: 'collectivites/:id/actions-à-suivre' → 'collectivites/:id/actions_à_suivre'
      .replace(/[^\w/:-]/g, '_');

    // Final example: method='GET', path='/api/v1/collectivites/123/actions'
    // → eventName='api_get_collectivites/:id/actions'
    return `api_${method.toLowerCase()}_${normalizedPath}`;
  }
}
