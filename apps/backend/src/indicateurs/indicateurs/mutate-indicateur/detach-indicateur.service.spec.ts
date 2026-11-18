import { AuthRole } from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { CommonErrorEnum } from '@tet/backend/utils/trpc/common-errors';
import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import { DetachIndicateurErrorEnum } from './detach-indicateur.errors';
import { DetachIndicateurService } from './detach-indicateur.service';

const user = {
  id: '00000000-0000-0000-0000-000000000001',
  role: AuthRole.AUTHENTICATED,
} as never;

const input = { indicateurId: 42, collectiviteId: 1 };

const toSousIndicateur = (
  overrides: { collectiviteId?: number | null; parentId?: number | null } = {}
) => ({
  id: 42,
  collectiviteId: 1,
  unite: 't',
  periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
  parentId: 7,
  hasChildren: false,
  ...overrides,
});

const createService = ({
  sousIndicateur = toSousIndicateur(),
  updatableIndicateurIds = [42, 7],
  isApiKeyAllowed = true,
}: {
  sousIndicateur?: ReturnType<typeof toSousIndicateur> | null;
  updatableIndicateurIds?: number[];
  isApiKeyAllowed?: boolean;
} = {}) => {
  const events: string[] = [];
  const tx = { name: 'tx' };
  const transactionManager = {
    executeSingle: vi.fn(
      (operation: (transaction: typeof tx) => Promise<unknown>) => operation(tx)
    ),
  };
  const repository = {
    getIndicateurInGroup: vi.fn(async () => {
      events.push('read');
      return sousIndicateur;
    }),
    detachSousIndicateur: vi.fn(async () => {
      events.push('detach');
    }),
  };
  const updateIndicateurService = {
    canUpdateIndicateur: vi.fn(
      async ({ indicateurId }: { indicateurId: number }) =>
        updatableIndicateurIds.includes(indicateurId)
    ),
    updateIndicateursModifiedFields: vi.fn(async () => {
      events.push('touch');
    }),
  };
  const permissionService = {
    isApiKeyAllowed: vi.fn(() =>
      isApiKeyAllowed
        ? success(undefined)
        : failure(CommonErrorEnum.UNAUTHORIZED)
    ),
  };
  const indicateurLockRepository = {
    lockForIndicateurMutation: vi.fn(async () => {
      events.push('lock-graph');
    }),
  };
  const service = new DetachIndicateurService(
    transactionManager as never,
    repository as never,
    updateIndicateurService as never,
    indicateurLockRepository as never,
    permissionService as never
  );
  return {
    service,
    tx,
    events,
    repository,
    updateIndicateurService,
    permissionService,
    transactionManager,
  };
};

describe('DetachIndicateurService', () => {
  it('retire le lien avec le parent après avoir verrouillé le graphe', async () => {
    const { service, events, repository, tx } = createService();

    await expect(service.detachIndicateur(input, { user })).resolves.toEqual(
      success(undefined)
    );

    expect(events).toEqual(['lock-graph', 'read', 'detach', 'touch']);
    expect(repository.detachSousIndicateur).toHaveBeenCalledWith(
      { parentId: 7, sousIndicateurId: 42, collectiviteId: 1 },
      tx
    );
  });

  it("enregistre l'auteur de la dissociation sur le sous-indicateur et son parent", async () => {
    const { service, updateIndicateurService, tx } = createService();

    await service.detachIndicateur(input, { user });

    expect(
      updateIndicateurService.updateIndicateursModifiedFields
    ).toHaveBeenCalledWith(
      { indicateurIds: [42, 7], collectiviteId: 1, user },
      tx
    );
  });

  it("refuse une clé d'API sans la permission de modifier un indicateur, avant toute transaction", async () => {
    const { service, transactionManager, permissionService } = createService({
      isApiKeyAllowed: false,
    });

    await expect(service.detachIndicateur(input, { user })).resolves.toEqual(
      failure(CommonErrorEnum.UNAUTHORIZED)
    );

    expect(permissionService.isApiKeyAllowed).toHaveBeenCalledWith(
      user,
      'indicateurs.indicateurs.update'
    );
    expect(transactionManager.executeSingle).not.toHaveBeenCalled();
  });

  it('vérifie le droit de modifier le sous-indicateur puis celui de modifier son parent', async () => {
    const { service, updateIndicateurService, tx } = createService();

    await service.detachIndicateur(input, { user });

    expect(updateIndicateurService.canUpdateIndicateur).toHaveBeenNthCalledWith(
      1,
      { user, collectiviteId: 1, indicateurId: 42 },
      undefined
    );
    expect(updateIndicateurService.canUpdateIndicateur).toHaveBeenNthCalledWith(
      2,
      { user, collectiviteId: 1, indicateurId: 7 },
      tx
    );
  });

  it('refuse sans le droit de modifier le sous-indicateur, avant toute transaction', async () => {
    const { service, transactionManager, repository } = createService({
      updatableIndicateurIds: [7],
    });

    await expect(service.detachIndicateur(input, { user })).resolves.toEqual(
      failure(CommonErrorEnum.UNAUTHORIZED)
    );

    expect(transactionManager.executeSingle).not.toHaveBeenCalled();
    expect(repository.detachSousIndicateur).not.toHaveBeenCalled();
  });

  it('refuse sans le droit de modifier le parent', async () => {
    const { service, repository } = createService({
      updatableIndicateurIds: [42],
    });

    await expect(service.detachIndicateur(input, { user })).resolves.toEqual(
      failure(CommonErrorEnum.UNAUTHORIZED)
    );

    expect(repository.detachSousIndicateur).not.toHaveBeenCalled();
  });

  it.each([
    { label: 'inexistant', sousIndicateur: null },
    {
      label: "d'une autre collectivité",
      sousIndicateur: toSousIndicateur({ collectiviteId: 99 }),
    },
    {
      label: 'prédéfini',
      sousIndicateur: toSousIndicateur({ collectiviteId: null }),
    },
  ])(
    'signale un indicateur $label comme introuvable',
    async ({ sousIndicateur }) => {
      const { service, repository } = createService({ sousIndicateur });

      await expect(service.detachIndicateur(input, { user })).resolves.toEqual(
        failure(CommonErrorEnum.NOT_FOUND)
      );

      expect(repository.detachSousIndicateur).not.toHaveBeenCalled();
    }
  );

  it("refuse un indicateur qui n'est le sous-indicateur d'aucun parent", async () => {
    const { service, repository } = createService({
      sousIndicateur: toSousIndicateur({ parentId: null }),
    });

    await expect(service.detachIndicateur(input, { user })).resolves.toEqual(
      failure(DetachIndicateurErrorEnum.INDICATEUR_NOT_SOUS_INDICATEUR)
    );

    expect(repository.detachSousIndicateur).not.toHaveBeenCalled();
  });
});
