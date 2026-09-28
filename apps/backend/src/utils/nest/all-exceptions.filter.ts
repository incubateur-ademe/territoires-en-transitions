import { ContextStoreService } from '@tet/backend/utils/context/context.service';
import { getSentryContextFromApplicationContext } from '@tet/backend/utils/sentry-init';
import {
  ArgumentsHost,
  Catch,
  HttpException,
  type HttpServer,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';
import { getErrorMessage } from '@tet/domain/utils';
import { Request, Response } from 'express';
import { getErrorCode } from './errors.utils';
import { HttpErrorResponse } from './http-error.response';

export const getHttpErrorResponse = (exception: unknown): HttpErrorResponse => {
  const httpErrorResponse: HttpErrorResponse = {
    status: 500,
    message: getErrorMessage(exception),
    code: getErrorCode(exception),
    timestamp: new Date().toISOString(),
  };

  if (exception instanceof HttpException) {
    const reponse = exception.getResponse();
    if (typeof reponse === 'object') {
      // @ts-expect-error `reponse` type is not precise enough
      const { statusCode, ...responseWithoutCode } = reponse;
      httpErrorResponse.details = responseWithoutCode;
    }

    httpErrorResponse.status = exception.getStatus();
  }
  return httpErrorResponse;
};

/**
 * Statuts HTTP imputables au client, et non au serveur.
 *
 * Même logique que `CLIENT_FAULT_ERROR_CODES` côté tRPC, plus la 404 : une
 * route inexistante appelée par un client externe (scanner, webhook obsolète…)
 * n'est pas un bug à investiguer. On les journalise en `warn` et on ne les
 * remonte pas dans Sentry.
 */
const CLIENT_FAULT_HTTP_STATUSES = new Set<number>([
  HttpStatus.UNAUTHORIZED,
  HttpStatus.NOT_FOUND,
  HttpStatus.TOO_MANY_REQUESTS,
]);

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    private readonly contextStoreService: ContextStoreService,
    applicationRef?: HttpServer
  ) {
    super(applicationRef);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const httpErrorResponse = {
      ...getHttpErrorResponse(exception),
      path: request.url,
    };

    if (CLIENT_FAULT_HTTP_STATUSES.has(httpErrorResponse.status)) {
      this.logger.warn(getErrorMessage(exception));
    } else {
      this.logger.error(getErrorMessage(exception));
      this.logger.error(exception);

      // report it to sentry with context
      Sentry.captureException(
        exception,
        getSentryContextFromApplicationContext(
          this.contextStoreService.getContext()
        )
      );
    }

    this.logger.log(`Response with status ${httpErrorResponse.status}`, {
      error_response: httpErrorResponse,
    });

    response.status(httpErrorResponse.status).json(httpErrorResponse);
  }
}
