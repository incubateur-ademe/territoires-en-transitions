import { describe, expect, it } from 'vitest';
import { toUserValeurNotAllowedFailure } from './user-indicateur-valeur.errors';

describe('toUserValeurNotAllowedFailure', () => {
  it('cite chaque indicateur protégé dans la cause', () => {
    const failure = toUserValeurNotAllowedFailure([2, 3]);

    expect(failure).toEqual({
      success: false,
      error: 'USER_VALUE_NOT_ALLOWED',
      cause: new Error(
        "Les indicateurs 2, 3 n'acceptent pas de valeur utilisateur"
      ),
    });
  });
});
