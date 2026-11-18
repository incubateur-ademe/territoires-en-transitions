import { IndicateurValeursError } from '@tet/backend/indicateurs/valeurs/indicateur-valeurs.errors';
import { buildRequesterUser } from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { ScoreIndicatifService } from './score-indicatif.service';

const user = buildRequesterUser('00000000-0000-0000-0000-000000000001');

const toServiceWithFailingListing = ({
  error,
  cause,
}: {
  error: IndicateurValeursError;
  cause: Error;
}): ScoreIndicatifService =>
  new ScoreIndicatifService(
    { getFormules: vi.fn().mockResolvedValue(success([])) } as never,
    {} as never,
    {} as never,
    {
      listIndicateurValeurs: vi.fn().mockResolvedValue(failure(error, cause)),
    } as never,
    {} as never,
    {
      getIndicateursAssocies: vi
        .fn()
        .mockResolvedValue(
          success({ indicateursAssocies: [{ indicateurId: 1 }] })
        ),
    } as never,
    {} as never
  );

describe('ScoreIndicatifService.getValeursUtilisables : échec de lecture des valeurs', () => {
  const input = { collectiviteId: 1, actionIds: ['cae_1.a'] };

  it('un refus de lecture ressort en UNAUTHORIZED avec sa cause', async () => {
    const cause = new Error('Droits insuffisants');

    const result = await toServiceWithFailingListing({
      error: 'UNAUTHORIZED',
      cause,
    }).getValeursUtilisables(input as never, { user });

    expect(result).toEqual({ success: false, error: 'UNAUTHORIZED', cause });
  });

  it('une erreur de base de données ressort en DATABASE_ERROR avec sa cause', async () => {
    const cause = new Error('connexion perdue');

    const result = await toServiceWithFailingListing({
      error: 'DATABASE_ERROR',
      cause,
    }).getValeursUtilisables(input as never, { user });

    expect(result).toEqual({ success: false, error: 'DATABASE_ERROR', cause });
  });

  it('une valeur invalide ressort en SERVER_ERROR avec sa cause', async () => {
    const cause = new Error(
      'indicateurIds or identifiantsReferentiel required'
    );

    const result = await toServiceWithFailingListing({
      error: 'INVALID_VALUE',
      cause,
    }).getValeursUtilisables(input as never, { user });

    expect(result).toEqual({ success: false, error: 'SERVER_ERROR', cause });
  });
});
