// tslint:disable-next-line:no-unused-variable
import { ArgumentsHost, Catch, HttpException, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { SentryExceptionCaptured } from '@sentry/nestjs';
import { Request, Response } from 'express';
import { getErrorWithCode } from './errors.utils';
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
    const error = exception as HttpException;
    httpErrorResponse.status = error.getStatus();
  }
  return httpErrorResponse;
};

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  @SentryExceptionCaptured()
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Log the error using json string to have full details
    this.logger.error(JSON.stringify(exception));

    const httpErrorResponse = getHttpErrorResponse(exception);
    httpErrorResponse.path = request.url;
    this.logger.log(`Response with status ${httpErrorResponse.status}`, {
      error_response: httpErrorResponse,
    });
    response.status(httpErrorResponse.status).json(httpErrorResponse);
  }
}
