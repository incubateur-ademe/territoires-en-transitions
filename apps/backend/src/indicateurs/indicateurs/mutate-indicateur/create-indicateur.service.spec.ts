import { AuthRole } from '@tet/backend/users/models/auth.models';
import { success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { ResourceType } from '@tet/domain/users';
import CreateIndicateurService from './create-indicateur.service';
import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';

describe('CreateIndicateurService', () => {
  it.each([false, true])(
    'verrouille le graphe avant toute insertion de définition (transaction partagée : %s)',
    async (sharedTransaction) => {
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
        isAllowed: vi
          .fn()
          .mockResolvedValue({ success: true, data: undefined }),
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
        upsertIndicateurFichesService as never,
        { lock: vi.fn() } as never
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
            },
            ...(sharedTransaction && { tx }),
          } as never
        )
      ).resolves.toEqual({ success: true, data: 42 });

      expect(transactionManager.executeSingle).toHaveBeenCalledWith(
        expect.any(Function),
        sharedTransaction ? tx : undefined
      );
      expect(permissionService.isAllowed).toHaveBeenCalledWith(
        expect.objectContaining({ id: '00000000-0000-0000-0000-000000000001' }),
        'indicateurs.indicateurs.create',
        ResourceType.COLLECTIVITE,
        { collectiviteId: 1 },
        sharedTransaction ? tx : undefined
      );
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
    }
  );

  it('reprend dans cet ordre les valeurs du parent et sa confidentialité à la création du premier sous-indicateur', async () => {
    const events: string[] = [];
    const tx = { name: 'tx' };
    const parent = {
      id: 7,
      collectiviteId: 1,
      unite: 't',
      periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
      parentId: null,
      hasChildren: false,
    };
    const transactionManager = {
      executeSingle: vi.fn(
        (operation: (transaction: typeof tx) => Promise<unknown>) =>
          operation(tx)
      ),
    };
    const repository = {
      getIndicateurInGroup: vi.fn().mockResolvedValue(parent),
      listDatesValeursSaisies: vi
        .fn()
        .mockResolvedValue(['2022-01-01', '2023-01-01']),
      isConfidentiel: vi.fn().mockResolvedValue(true),
      createIndicateurPerso: vi.fn(async () => {
        events.push('insert-definition');
        return success(42);
      }),
      attachSousIndicateur: vi.fn(async () => {
        events.push('attach');
      }),
      moveValeursSaisies: vi.fn(async () => {
        events.push('move-valeurs');
      }),
    };
    const indicateurLockRepository = {
      lockForIndicateurMutation: vi.fn(async () => {
        events.push('lock-graph');
      }),
    };
    const indicateurValeurLockRepository = {
      lock: vi.fn(async () => {
        events.push('lock-valeurs');
      }),
    };
    const service = new CreateIndicateurService(
      transactionManager as never,
      repository as never,
      {
        isAllowed: vi
          .fn()
          .mockResolvedValue({ success: true, data: undefined }),
      } as never,
      indicateurLockRepository as never,
      { upsertIndicateurFiches: vi.fn() } as never,
      indicateurValeurLockRepository as never
    );

    await expect(
      service.createIndicateurPerso(
        {
          collectiviteId: 1,
          titre: 'Sous-indicateur 1',
          parentId: 7,
          thematiques: [],
          estFavori: false,
          isApplicable: true,
        },
        {
          user: {
            id: '00000000-0000-0000-0000-000000000001',
            role: AuthRole.AUTHENTICATED,
          },
        } as never
      )
    ).resolves.toEqual({ success: true, data: 42 });

    expect(events).toEqual([
      'lock-graph',
      'insert-definition',
      'attach',
      'lock-valeurs',
      'move-valeurs',
    ]);
    expect(repository.createIndicateurPerso).toHaveBeenCalledWith(
      expect.objectContaining({ estConfidentiel: true }),
      tx
    );
    expect(indicateurValeurLockRepository.lock).toHaveBeenCalledWith(
      [
        { collectiviteId: 1, dateValeur: '2022-01-01' },
        { collectiviteId: 1, dateValeur: '2023-01-01' },
      ],
      tx
    );
    expect(repository.moveValeursSaisies).toHaveBeenCalledWith(
      { fromIndicateurId: 7, toIndicateurId: 42, collectiviteId: 1 },
      tx
    );
  });

  it('ne verrouille ni ne déplace aucune valeur quand le parent a déjà un sous-indicateur', async () => {
    const tx = { name: 'tx' };
    const parent = {
      id: 7,
      collectiviteId: 1,
      unite: 't',
      periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
      parentId: null,
      hasChildren: true,
    };
    const repository = {
      getIndicateurInGroup: vi.fn().mockResolvedValue(parent),
      listDatesValeursSaisies: vi.fn(),
      isConfidentiel: vi.fn(),
      createIndicateurPerso: vi.fn().mockResolvedValue(success(43)),
      attachSousIndicateur: vi.fn(),
      moveValeursSaisies: vi.fn(),
    };
    const indicateurValeurLockRepository = { lock: vi.fn() };
    const service = new CreateIndicateurService(
      {
        executeSingle: vi.fn(
          (operation: (transaction: typeof tx) => Promise<unknown>) =>
            operation(tx)
        ),
      } as never,
      repository as never,
      {
        isAllowed: vi
          .fn()
          .mockResolvedValue({ success: true, data: undefined }),
      } as never,
      { lockForIndicateurMutation: vi.fn() } as never,
      { upsertIndicateurFiches: vi.fn() } as never,
      indicateurValeurLockRepository as never
    );

    await service.createIndicateurPerso(
      {
        collectiviteId: 1,
        titre: 'Sous-indicateur 2',
        parentId: 7,
        thematiques: [],
        estFavori: false,
        estConfidentiel: false,
        isApplicable: true,
      },
      {
        user: {
          id: '00000000-0000-0000-0000-000000000001',
          role: AuthRole.AUTHENTICATED,
        },
      } as never
    );

    expect(repository.listDatesValeursSaisies).not.toHaveBeenCalled();
    expect(indicateurValeurLockRepository.lock).not.toHaveBeenCalled();
    expect(repository.moveValeursSaisies).not.toHaveBeenCalled();
  });
});
