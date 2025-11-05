import { ContextStoreService } from '@/backend/utils/context/context.service';
import { getSentryContextFromApplicationContext } from '@/backend/utils/sentry-init';
import {
  ArgumentsHost,
  Catch,
  HttpException,
  type HttpServer,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';
import { Request, Response } from 'express';
import { getErrorCode } from './errors.utils';
import { HttpErrorResponse } from './http-error.response';
import { getErrorMessage } from '@/domain/utils';

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

    this.logger.error(getErrorMessage(exception));
    this.logger.error(exception);

    // report it to sentry with context
    Sentry.captureException(
      exception,
      getSentryContextFromApplicationContext(
        this.contextStoreService.getContext()
      )
    );

    const httpErrorResponse = {
      ...getHttpErrorResponse(exception),
      path: request.url,
    };

    this.logger.log(`Response with status ${httpErrorResponse.status}`, {
      error_response: httpErrorResponse,
    });

    response.status(httpErrorResponse.status).json(httpErrorResponse);
  }
}
