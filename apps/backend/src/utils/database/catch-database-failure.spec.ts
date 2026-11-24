import { Logger } from '@nestjs/common';
import { failure, success } from '@tet/backend/utils/result.type';
import {
  catchDatabaseFailure,
  toDatabaseFailure,
} from './catch-database-failure';

describe('catchDatabaseFailure', () => {
  it('retourne tel quel le Result de l’opération', async () => {
    const operationFailure = failure('UNAUTHORIZED', new Error('refus'));

    await expect(catchDatabaseFailure(async () => success(7))).resolves.toEqual(
      success(7)
    );
    await expect(
      catchDatabaseFailure(async () => operationFailure)
    ).resolves.toBe(operationFailure);
  });

  it('convertit une exception en DATABASE_ERROR avec sa cause et la journalise', async () => {
    const cause = new Error('connexion perdue');
    const loggedError = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    onTestFinished(() => loggedError.mockRestore());

    const result = await catchDatabaseFailure(async () => {
      throw cause;
    });

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
    expect(loggedError).toHaveBeenCalledWith(
      'Exception imprévue convertie en DATABASE_ERROR:',
      cause
    );
  });

  it('enveloppe une valeur lancée qui n’est pas une Error', async () => {
    const loggedError = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    onTestFinished(() => loggedError.mockRestore());

    const result = await catchDatabaseFailure(async () => {
      throw 'valeur brute';
    });

    expect(result).toEqual(
      failure('DATABASE_ERROR', new Error('valeur brute'))
    );
  });
});

describe('toDatabaseFailure', () => {
  it('garde la cause d’origine quand elle existe', () => {
    const cause = new Error('graphe indisponible');

    expect(
      toDatabaseFailure({ error: 'LOAD_CALCUL_GRAPH_FAILED', cause })
    ).toEqual(failure('DATABASE_ERROR', cause));
  });

  it('conserve le code d’origine dans la cause quand elle manque', () => {
    expect(toDatabaseFailure({ error: 'COMPUTE_VALEURS_FAILED' })).toEqual(
      failure('DATABASE_ERROR', new Error('COMPUTE_VALEURS_FAILED'))
    );
  });
});
