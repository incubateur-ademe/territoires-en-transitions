import { ContextStoreService } from '@/backend/utils/context/context.service';
import { getSentryContextFromApplicationContext } from '@/backend/utils/sentry-init';
import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpServer,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';
import { Request, Response } from 'express';
import { getErrorMessage, getErrorWithCode } from './errors.utils';
import { HttpErrorResponse } from './http-error.response';

export const getHttpErrorResponse = (exception: unknown): HttpErrorResponse => {
  const errorWithCode = getErrorWithCode(exception);
  const httpErrorResponse: HttpErrorResponse = {
    status: 500,
    message: errorWithCode.message,
    code: errorWithCode.code,
    timestamp: new Date().toISOString(),
  };
  if (exception instanceof HttpException) {
    const reponse = exception.getResponse();
    if (typeof reponse === 'object') {
      // @ts-ignore
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

    const httpErrorResponse = getHttpErrorResponse(exception);
    httpErrorResponse.path = request.url;
    this.logger.log(`Response with status ${httpErrorResponse.status}`, {
      error_response: httpErrorResponse,
    });
    response.status(httpErrorResponse.status).json(httpErrorResponse);
  }
}
