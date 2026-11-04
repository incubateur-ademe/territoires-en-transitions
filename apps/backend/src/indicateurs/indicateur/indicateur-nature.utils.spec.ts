import { InternalServerErrorException } from '@nestjs/common';
import { failure, success } from '@tet/backend/utils/result.type';
import { getIndicateurDataOrThrow } from './indicateur-nature.utils';

describe('getIndicateurDataOrThrow', () => {
  it('rend les données d’un succès', () => {
    expect(getIndicateurDataOrThrow(success([{ id: 1 }]))).toEqual([{ id: 1 }]);
  });

  it('lève une erreur serveur qui porte la cause d’un échec', () => {
    const cause = new Error(
      'Indicateur 4 : nature incohérente (PERSO_WITH_GROUPEMENT)'
    );
    const operation = () =>
      getIndicateurDataOrThrow(failure('DATABASE_ERROR', cause));

    expect(operation).toThrow(InternalServerErrorException);
    expect(operation).toThrow(
      expect.objectContaining({ message: cause.message, cause })
    );
  });

  it('nomme l’erreur quand l’échec n’a pas de cause', () => {
    expect(() => getIndicateurDataOrThrow(failure('DATABASE_ERROR'))).toThrow(
      'DATABASE_ERROR'
    );
  });
});
