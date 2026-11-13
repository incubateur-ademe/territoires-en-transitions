import { HttpException } from '@nestjs/common';
import { failure } from '@tet/backend/utils/result.type';
import { describe, expect, it } from 'vitest';
import { getImportResultOrThrow } from './import-indicateur-definition.errors';

describe('getImportResultOrThrow', () => {
  it("garde la cause d'une erreur de base de données", () => {
    const pgError = new Error('out of shared memory');
    const cause = new Error('Failed query: SELECT 1', { cause: pgError });

    const thrown = (() => {
      try {
        getImportResultOrThrow(failure('DATABASE_ERROR', cause));
      } catch (error) {
        return error;
      }
    })();

    expect(thrown).toBeInstanceOf(HttpException);
    expect((thrown as HttpException).getStatus()).toBe(500);
    expect((thrown as HttpException).cause).toBe(cause);
  });
});
