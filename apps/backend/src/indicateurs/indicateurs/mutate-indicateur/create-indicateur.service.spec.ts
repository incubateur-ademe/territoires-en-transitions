import { AuthRole } from '@tet/backend/users/models/auth.models';
import { success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import CreateIndicateurService from './create-indicateur.service';
import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';

describe('CreateIndicateurService', () => {
  it('verrouille le graphe avant toute insertion de définition', async () => {
    const events: string[] = [];
    const tx = { name: 'tx' };
    const transactionManager = {
      executeSingle: vi.fn(
        (operation: (transaction: typeof tx) => Promise<unknown>) =>
          operation(tx)
      ),
    };
    const repository = {
      createIndicateurPerso: vi.fn(async () => {
        events.push('insert-definition');
        return success(42);
      }),
    };
    const permissionService = {
      isAllowed: vi.fn().mockResolvedValue({ success: true, data: undefined }),
    };
    const indicateurLockRepository = {
      lockForIndicateurMutation: vi.fn(async () => {
        events.push('lock-graph');
      }),
    };
    const upsertIndicateurFichesService = {
      upsertIndicateurFiches: vi.fn().mockResolvedValue(success(undefined)),
    };
    const service = new CreateIndicateurService(
      transactionManager as never,
      repository as never,
      permissionService as never,
      indicateurLockRepository as never,
      upsertIndicateurFichesService as never
    );

    await expect(
      service.createIndicateurPerso(
        {
          collectiviteId: 1,
          titre: 'Indicateur mensuel',
          unite: 't',
          periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
          thematiques: [],
          estFavori: false,
          estConfidentiel: true,
          isApplicable: true,
          ficheId: 9,
        },
        {
          user: {
            id: '00000000-0000-0000-0000-000000000001',
            role: AuthRole.AUTHENTICATED,
          } as never,
        }
      )
    ).resolves.toEqual({ success: true, data: 42 });

    expect(events).toEqual(['lock-graph', 'insert-definition']);
    expect(
      indicateurLockRepository.lockForIndicateurMutation
    ).toHaveBeenCalledWith(tx);
    expect(repository.createIndicateurPerso).toHaveBeenCalledWith(
      {
        collectiviteId: 1,
        titre: 'Indicateur mensuel',
        unite: 't',
        periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
        thematiqueIds: [],
        commentaire: undefined,
        estFavori: false,
        estConfidentiel: true,
        isApplicable: true,
        modifiedBy: '00000000-0000-0000-0000-000000000001',
      },
      tx
    );
    expect(
      upsertIndicateurFichesService.upsertIndicateurFiches
    ).toHaveBeenCalledWith(
      { indicateurId: 42, collectiviteId: 1, ficheIds: [9] },
      {
        user: {
          id: '00000000-0000-0000-0000-000000000001',
          role: AuthRole.AUTHENTICATED,
        },
        tx,
      }
    );
  });
});
