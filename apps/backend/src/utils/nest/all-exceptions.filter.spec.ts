import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PgIntegrityConstraintViolation } from '../postgresql-error-codes.enum';
import { getHttpErrorResponse } from './all-exceptions.filter';

vi.mock('../error-tracking/capture-exception', () => ({
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
