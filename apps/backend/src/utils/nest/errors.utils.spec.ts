import { describe, expect, it } from 'vitest';
import {
  PgIntegrityConstraintViolation,
  PgSuccessfulCompletion,
} from '../postgresql-error-codes.enum';
import { isUniqueViolation } from './errors.utils';

const toErrorCausedByPgCode = (code: string): Error =>
  new Error('Failed query', { cause: Object.assign(new Error(), { code }) });

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
