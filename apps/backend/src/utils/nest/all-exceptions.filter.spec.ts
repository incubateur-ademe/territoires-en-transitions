import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ContextStoreService } from '../context/context.service';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PgIntegrityConstraintViolation } from '../postgresql-error-codes.enum';
import {
  AllExceptionsFilter,
  getHttpErrorResponse,
} from './all-exceptions.filter';

vi.mock('@tet/backend/utils/error-tracking/capture-exception', () => ({
  captureException: vi.fn(),
}));

describe('getHttpErrorResponse', () => {
  it('places the native HTTP error code in the existing response envelope', () => {
    const response = getHttpErrorResponse(
      new HttpException('Fiche indisponible', HttpStatus.NOT_FOUND, {
        errorCode: 'FICHE_UNAVAILABLE',
      })
    );

    expect(response).toEqual({
      status: 404,
      message: 'Fiche indisponible',
      code: 'FICHE_UNAVAILABLE',
      timestamp: expect.any(String),
    });
  });

  it('preserves explicit HTTP details and status', () => {
    const response = getHttpErrorResponse(
      new BadRequestException(
        {
          statusCode: 400,
          message: 'Validation failed',
          errors: [{ path: ['id'], message: 'Invalid id' }],
        },
        { errorCode: 'INVALID_FICHE' }
      )
    );

    expect(response).toMatchObject({
      status: 400,
      message: 'Validation failed',
      code: 'INVALID_FICHE',
      details: {
        message: 'Validation failed',
        errors: [{ path: ['id'], message: 'Invalid id' }],
      },
    });
    expect(response.details).not.toHaveProperty('statusCode');
  });

  it('retains native exception details alongside the envelope code', () => {
    const response = getHttpErrorResponse(
      new BadRequestException('Fiche invalide', {
        errorCode: 'INVALID_FICHE',
      })
    );

    expect(response).toMatchObject({
      status: 400,
      message: 'Fiche invalide',
      code: 'INVALID_FICHE',
      details: {
        message: 'Fiche invalide',
        error: 'Bad Request',
        errorCode: 'INVALID_FICHE',
      },
    });
  });

  it('preserves database error codes and unknown error messages', () => {
    const error = new Error('Failed query', {
      cause: Object.assign(new Error('Duplicate key'), {
        code: PgIntegrityConstraintViolation.UniqueViolation,
      }),
    });

    expect(getHttpErrorResponse(error)).toMatchObject({
      status: 500,
      message: 'Failed query',
      code: PgIntegrityConstraintViolation.UniqueViolation,
    });
  });

  it.each([
    { status: 500, message: 'Internal Server Error' },
    { status: 503, message: 'Service Unavailable' },
  ])(
    'hides the private message of a non-exposed HTTP $status error',
    ({ status, message }) => {
      const error = Object.assign(new Error('Failed to read /private/file'), {
        status,
        statusCode: status,
        expose: false,
      });

      expect(getHttpErrorResponse(error)).toMatchObject({ status, message });
    }
  );

  it('preserves explicitly exposed error messages', () => {
    const error = Object.assign(new Error('Public failure message'), {
      status: 500,
      statusCode: 500,
      expose: true,
    });

    expect(getHttpErrorResponse(error).message).toBe('Public failure message');
  });
});

describe('HTTP errors from Express middleware', () => {
  it.each([400, 413, 415, 500])(
    'preserves an exposed HTTP %i status and message',
    (status) => {
      const error = Object.assign(new Error('Public failure message'), {
        status,
        statusCode: status,
        expose: true,
      });
      expect(getHttpErrorResponse(error)).toMatchObject({
        status,
        message: 'Public failure message',
      });
    }
  );

  it.each([
    { status: 400, message: 'Bad Request' },
    { status: 413, message: 'Payload Too Large' },
    { status: 415, message: 'Unsupported Media Type' },
    { status: 599, message: 'Internal server error' },
  ])('masks non-exposed HTTP $status messages', ({ status, message }) => {
    for (const expose of [false, undefined, 'true']) {
      const error = Object.assign(new Error('Private middleware details'), {
        status,
        statusCode: status,
        ...(expose === undefined ? {} : { expose }),
      });
      expect(getHttpErrorResponse(error)).toMatchObject({ status, message });
    }
  });

  it.each([
    { status: 399, statusCode: 399 },
    { status: 600, statusCode: 600 },
    { status: 413.5, statusCode: 413.5 },
    { status: '413', statusCode: '413' },
    { status: 400, statusCode: 413 },
  ])('does not trust invalid or inconsistent statuses: %j', (properties) => {
    const error = Object.assign(new Error('Unexpected failure'), properties);
    expect(getHttpErrorResponse(error).status).toBe(500);
  });
});

@Controller('parse-body')
class ParseBodyController {
  @Post()
  @HttpCode(200)
  parse(@Body() body: unknown) {
    return body;
  }
}

describe('AllExceptionsFilter with the HTTP body parser', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ParseBodyController],
      providers: [ContextStoreService],
    }).compile();
    app = module.createNestApplication<NestExpressApplication>({
      logger: false,
    });
    app.useBodyParser('json', { limit: '64b' });
    app.useGlobalFilters(
      new AllExceptionsFilter(
        app.get(ContextStoreService),
        app.getHttpAdapter()
      )
    );
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('returns 400 for malformed JSON', async () => {
    const response = await request(app.getHttpServer())
      .post('/parse-body')
      .set('Content-Type', 'application/json')
      .send('{"unfinished":')
      .expect(400);
    expect(response.body).toMatchObject({
      status: 400,
      path: '/parse-body',
      message: expect.any(String),
    });
  });

  it('returns 413 for an oversized body', async () => {
    const response = await request(app.getHttpServer())
      .post('/parse-body')
      .send({ value: 'x'.repeat(128) })
      .expect(413);
    expect(response.body).toMatchObject({
      status: 413,
      message: 'request entity too large',
    });
  });

  it('returns 415 for an unsupported charset', async () => {
    const response = await request(app.getHttpServer())
      .post('/parse-body')
      .set('Content-Type', 'application/json; charset=iso-8859-1')
      .send('{}')
      .expect(415);
    expect(response.body).toMatchObject({
      status: 415,
      message: expect.stringContaining('unsupported charset'),
    });
  });
});
