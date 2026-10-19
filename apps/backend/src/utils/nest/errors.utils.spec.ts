import { describe, expect, it } from 'vitest';
import {
  PgIntegrityConstraintViolation,
  PgSuccessfulCompletion,
} from '../postgresql-error-codes.enum';
import { getErrorCode, isUniqueViolation } from './errors.utils';

const toErrorCausedByPgCode = (code: string): Error =>
  new Error('Failed query', { cause: Object.assign(new Error(), { code }) });

describe('getErrorCode', () => {
  it('prefers the public HTTP error code over underlying error codes', () => {
    const error = Object.assign(
      new BadRequestException('La fiche existe déjà', {
        errorCode: 'FICHE_ALREADY_EXISTS',
        cause: Object.assign(new Error('Database failure'), {
          code: PgIntegrityConstraintViolation.UniqueViolation,
        }),
      }),
      { code: 'WRAPPER_ERROR' }
    );

    expect(getErrorCode(error)).toBe('FICHE_ALREADY_EXISTS');
  });

  it('preserves database cause codes ahead of wrapper codes', () => {
    const error = Object.assign(
      toErrorCausedByPgCode(PgIntegrityConstraintViolation.UniqueViolation),
      { code: 'QUERY_FAILED' }
    );

    expect(getErrorCode(error)).toBe(
      PgIntegrityConstraintViolation.UniqueViolation
    );
  });

  it('reads the direct code when the cause has no code', () => {
    const error = Object.assign(
      new Error('Failure', { cause: new Error('Original failure') }),
      { code: 'REQUEST_FAILED' }
    );

    expect(getErrorCode(error)).toBe('REQUEST_FAILED');
  });

  it.each([undefined, null, 'failure', new Error('Failure'), { code: 500 }])(
    'handles unknown values without a string code: %s',
    (error) => {
      expect(getErrorCode(error)).toBeUndefined();
    }
  );
});

describe('isUniqueViolation', () => {
  it("reconnaît une erreur causée par une violation d'unicité (23505)", () => {
    expect(
      isUniqueViolation(
        toErrorCausedByPgCode(PgIntegrityConstraintViolation.UniqueViolation)
      )
    ).toBe(true);
  });

  it("ne reconnaît pas une erreur causée par une autre violation d'intégrité", () => {
    expect(
      isUniqueViolation(
        toErrorCausedByPgCode(
          PgIntegrityConstraintViolation.ForeignKeyViolation
        )
      )
    ).toBe(false);
  });

  it("ne reconnaît pas une erreur causée par un code qui n'est pas une violation", () => {
    expect(
      isUniqueViolation(
        toErrorCausedByPgCode(PgSuccessfulCompletion.SuccessfulCompletion)
      )
    ).toBe(false);
  });

  it('ne reconnaît pas une erreur sans cause', () => {
    expect(
      isUniqueViolation(
        Object.assign(new Error('Failed query'), {
          code: PgIntegrityConstraintViolation.UniqueViolation,
        })
      )
    ).toBe(false);
  });

  it("ne reconnaît pas une valeur qui n'est pas une erreur", () => {
    expect(
      isUniqueViolation({
        cause: { code: PgIntegrityConstraintViolation.UniqueViolation },
      })
    ).toBe(false);
  });
});
import { BadRequestException } from '@nestjs/common';
