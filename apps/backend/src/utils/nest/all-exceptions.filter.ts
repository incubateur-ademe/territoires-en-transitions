import { ContextStoreService } from '@tet/backend/utils/context/context.service';
import { captureException } from '@tet/backend/utils/error-tracking/capture-exception';
import {
  ArgumentsHost,
  Catch,
  HttpException,
  type HttpServer,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { getErrorMessage } from '@tet/domain/utils';
import { Request, Response } from 'express';
import { STATUS_CODES } from 'node:http';
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
    const response = exception.getResponse();
    if (typeof response === 'object' && response !== null) {
      httpErrorResponse.details = Object.fromEntries(
        Object.entries(response).filter(([key]) => key !== 'statusCode')
      );
    }

    httpErrorResponse.status = exception.getStatus();
  } else if (
    exception instanceof Error &&
    'expose' in exception &&
    exception.expose === false &&
    'statusCode' in exception &&
    typeof exception.statusCode === 'number' &&
    Number.isInteger(exception.statusCode) &&
    exception.statusCode >= 500 &&
    exception.statusCode < 600 &&
    'status' in exception &&
    exception.status === exception.statusCode
  ) {
    httpErrorResponse.status = exception.statusCode;
    httpErrorResponse.message =
      STATUS_CODES[exception.statusCode] ?? 'Internal server error';
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

    // remontée dans PostHog, avec le contexte de la requête
    captureException(exception, this.contextStoreService.getContext());

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
