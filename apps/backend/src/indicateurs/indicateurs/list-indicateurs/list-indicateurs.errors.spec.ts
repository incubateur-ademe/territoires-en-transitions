import { failure } from '@tet/backend/utils/result.type';
import { fromListIndicateursFailure } from '../../valeurs/indicateur-valeurs.errors';
import { listIndicateursErrorConfig } from './list-indicateurs.errors';

describe('listIndicateursErrorConfig', () => {
  it('garde les codes d’avant : refus en FORBIDDEN, introuvable en BAD_REQUEST, lecture en INTERNAL_SERVER_ERROR, avec le message de la cause', () => {
    expect({
      refus: listIndicateursErrorConfig.commonErrors?.UNAUTHORIZED,
      lecture: listIndicateursErrorConfig.commonErrors?.DATABASE_ERROR,
      introuvable:
        listIndicateursErrorConfig.specificErrors?.INDICATEUR_NOT_FOUND,
    }).toEqual({
      refus: { code: 'FORBIDDEN', messageFromCause: true },
      lecture: { code: 'INTERNAL_SERVER_ERROR', messageFromCause: true },
      introuvable: { code: 'BAD_REQUEST', messageFromCause: true },
    });
  });
});

describe('fromListIndicateursFailure', () => {
  it.each([
    ['UNAUTHORIZED', 'UNAUTHORIZED'],
    ['INDICATEUR_NOT_FOUND', 'INVALID_VALUE'],
    ['DATABASE_ERROR', 'DATABASE_ERROR'],
  ] as const)(
    'convertit %s en %s en gardant la cause',
    (listError, valeursError) => {
      const cause = new Error('cause d’origine');

      expect(fromListIndicateursFailure({ error: listError, cause })).toEqual(
        failure(valeursError, cause)
      );
    }
  );
});
