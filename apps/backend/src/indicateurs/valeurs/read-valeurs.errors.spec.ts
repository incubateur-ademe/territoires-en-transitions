import { describe, expect, it } from 'vitest';
import { readValeursErrorConfig } from './read-valeurs.errors';

describe('readValeursErrorConfig', () => {
  it('garde les codes d’avant, avec le message de la cause', () => {
    expect(readValeursErrorConfig.commonErrors).toEqual({
      UNAUTHORIZED: { code: 'FORBIDDEN', messageFromCause: true },
      NOT_FOUND: { code: 'NOT_FOUND', messageFromCause: true },
      DATABASE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        messageFromCause: true,
      },
    });
  });
});
