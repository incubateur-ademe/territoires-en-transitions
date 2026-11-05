import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  AuthRole,
  type AuthenticatedUser,
} from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { UpdateIndicateurService } from './update-indicateur.service';

const user = {
  id: '00000000-0000-0000-0000-000000000001',
  role: AuthRole.AUTHENTICATED,
} as AuthenticatedUser;

const indicateurLockRepository = {
  lockForIndicateurMutation: vi.fn().mockResolvedValue(undefined),
};

function createAuthorizationDependencies() {
  return {
    getUserPermissionsService: {
      getUserRolesAndPermissions: vi.fn().mockResolvedValue({
        success: true,
        data: {
          roles: [],
          permissions: ['indicateurs.indicateurs.update'],
          collectivites: [],
        },
      }),
    },
    permissionService: {
      isApiKeyAllowed: vi.fn().mockReturnValue(success(undefined)),
    },
  };
}

describe('UpdateIndicateurService', () => {
  it('returns an API-key denial before reading or writing the definition', async () => {
    const transactionManager = { executeSingle: vi.fn() };
    const repository = { getIndicateurNature: vi.fn() };
    const { getUserPermissionsService, permissionService } =
      createAuthorizationDependencies();
    permissionService.isApiKeyAllowed.mockReturnValue(failure('UNAUTHORIZED'));
    const service = new UpdateIndicateurService(
      transactionManager as never,
      repository as never,
      getUserPermissionsService as never,
      permissionService as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      indicateurLockRepository as never
    );

    await expect(
      service.updateIndicateur(
        {
          indicateurId: 42,
          collectiviteId: 1,
          indicateurFields: { isSuivi: false },
        },
        { user }
      )
    ).resolves.toEqual(failure('UNAUTHORIZED'));
    expect(permissionService.isApiKeyAllowed).toHaveBeenCalledWith(
      user,
      'indicateurs.indicateurs.update'
    );
    expect(repository.getIndicateurNature).not.toHaveBeenCalled();
    expect(
      getUserPermissionsService.getUserRolesAndPermissions
    ).not.toHaveBeenCalled();
    expect(transactionManager.executeSingle).not.toHaveBeenCalled();
  });

  it("refuse l'identifiant d'un indicateur d'une autre collectivité avant l'autorisation", async () => {
    const transactionManager = { executeSingle: vi.fn() };
    const repository = {
      getIndicateurNature: vi.fn().mockResolvedValue({
        collectiviteId: 2,
        identifiantReferentiel: null,
        groupementId: null,
        periodicite: 'annuelle',
      }),
    };
    const { getUserPermissionsService, permissionService } =
      createAuthorizationDependencies();
    const service = new UpdateIndicateurService(
      transactionManager as never,
      repository as never,
      getUserPermissionsService as never,
      permissionService as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      indicateurLockRepository as never
    );

    await expect(
      service.updateIndicateur(
        {
          indicateurId: 42,
          collectiviteId: 1,
          indicateurFields: { commentaire: 'attaque inter-collectivités' },
        },
        { user }
      )
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(
      getUserPermissionsService.getUserRolesAndPermissions
    ).not.toHaveBeenCalled();
    expect(transactionManager.executeSingle).not.toHaveBeenCalled();
  });

  it.each([
    {
      label: 'possédée par une collectivité et rattachée à un groupement',
      collectiviteId: 1,
      identifiantReferentiel: null,
      groupementId: 99,
    },
    {
      label: 'perso qui porte un identifiant référentiel',
      collectiviteId: 1,
      identifiantReferentiel: 'cae_1.a',
      groupementId: null,
    },
    {
      label: 'sans collectivité ni identifiant référentiel',
      collectiviteId: null,
      identifiantReferentiel: null,
      groupementId: null,
    },
  ])(
    'refuse par défaut une définition $label',
    async ({ collectiviteId, identifiantReferentiel, groupementId }) => {
      const transactionManager = { executeSingle: vi.fn() };
      const repository = {
        getIndicateurNature: vi.fn().mockResolvedValue({
          collectiviteId,
          identifiantReferentiel,
          groupementId,
        }),
      };
      const { getUserPermissionsService, permissionService } =
        createAuthorizationDependencies();
      const service = new UpdateIndicateurService(
        transactionManager as never,
        repository as never,
        getUserPermissionsService as never,
        permissionService as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        indicateurLockRepository as never
      );

      await expect(
        service.updateIndicateur(
          {
            indicateurId: 42,
            collectiviteId: 1,
            indicateurFields: { commentaire: 'tentative' },
          },
          { user }
        )
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(transactionManager.executeSingle).not.toHaveBeenCalled();
    }
  );

  it("refuse la mutation des thématiques globales d'un indicateur prédéfini", async () => {
    const transactionManager = { executeSingle: vi.fn() };
    const repository = {
      getIndicateurNature: vi.fn().mockResolvedValue({
        collectiviteId: null,
        identifiantReferentiel: 'cae_1.a',
        groupementId: null,
        periodicite: 'annuelle',
      }),
    };
    const { getUserPermissionsService, permissionService } =
      createAuthorizationDependencies();
    const service = new UpdateIndicateurService(
      transactionManager as never,
      repository as never,
      getUserPermissionsService as never,
      permissionService as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      indicateurLockRepository as never
    );

    await expect(
      service.updateIndicateur(
        {
          indicateurId: 42,
          collectiviteId: 1,
          indicateurFields: { thematiques: [{ id: 13 }] },
        },
        { user }
      )
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(transactionManager.executeSingle).not.toHaveBeenCalled();
  });

  it('partage la transaction de la définition avec toutes ses relations', async () => {
    const tx = { name: 'tx' };
    const transactionManager = {
      executeSingle: vi.fn(
        (operation: (transaction: typeof tx) => Promise<unknown>) =>
          operation(tx)
      ),
    };
    const repository = {
      getIndicateurNature: vi.fn().mockResolvedValue({
        collectiviteId: 1,
        identifiantReferentiel: null,
        groupementId: null,
        periodicite: 'annuelle',
      }),
      lockIndicateurNature: vi.fn().mockResolvedValue({
        collectiviteId: 1,
        identifiantReferentiel: null,
        groupementId: null,
        periodicite: 'annuelle',
      }),
      touchIndicateurs: vi.fn().mockResolvedValue(undefined),
    };
    const { getUserPermissionsService, permissionService } =
      createAuthorizationDependencies();
    const upsertIndicateurFichesService = {
      upsertIndicateurFiches: vi.fn().mockResolvedValue(success(undefined)),
    };
    const upsertIndicateurPilotesService = {
      upsertIndicateurPilotes: vi.fn().mockResolvedValue(undefined),
    };
    const upsertIndicateurServicesService = {
      upsertIndicateurServices: vi.fn().mockResolvedValue(undefined),
    };
    const upsertIndicateurThematiquesService = {
      upsertIndicateurThematiques: vi.fn().mockResolvedValue(undefined),
    };
    const service = new UpdateIndicateurService(
      transactionManager as never,
      repository as never,
      getUserPermissionsService as never,
      permissionService as never,
      upsertIndicateurFichesService as never,
      upsertIndicateurPilotesService as never,
      upsertIndicateurServicesService as never,
      upsertIndicateurThematiquesService as never,
      indicateurLockRepository as never
    );

    await service.updateIndicateur(
      {
        indicateurId: 42,
        collectiviteId: 1,
        indicateurFields: {
          ficheIds: [11],
          pilotes: [{ userId: user.id }],
          services: [{ id: 12 }],
          thematiques: [{ id: 13 }],
        },
      },
      { user }
    );

    expect(
      upsertIndicateurFichesService.upsertIndicateurFiches
    ).toHaveBeenCalledWith(
      { indicateurId: 42, collectiviteId: 1, ficheIds: [11] },
      { user, tx }
    );
    expect(
      upsertIndicateurPilotesService.upsertIndicateurPilotes
    ).toHaveBeenCalledWith(
      {
        indicateurId: 42,
        collectiviteId: 1,
        pilotes: [{ userId: user.id }],
      },
      tx
    );
    expect(
      upsertIndicateurServicesService.upsertIndicateurServices
    ).toHaveBeenCalledWith(
      { indicateurId: 42, collectiviteId: 1, serviceIds: [12] },
      tx
    );
    expect(
      upsertIndicateurThematiquesService.upsertIndicateurThematiques
    ).toHaveBeenCalledWith({ indicateurId: 42, thematiqueIds: [13] }, tx);
    expect(repository.touchIndicateurs).toHaveBeenCalledWith(
      {
        indicateurIds: [42],
        collectiviteId: 1,
        modifiedBy: user.id,
      },
      tx
    );
    expect(transactionManager.executeSingle).toHaveBeenCalledOnce();
  });

  it.each([
    {
      label: 'prédéfinie',
      collectiviteId: null,
      identifiantReferentiel: 'cae_1.a',
    },
    { label: 'perso', collectiviteId: 1, identifiantReferentiel: null },
  ])(
    'refuse une modification de périodicité pour la définition $label',
    async ({ collectiviteId, identifiantReferentiel }) => {
      const transactionManager = { executeSingle: vi.fn() };
      const repository = {
        getIndicateurNature: vi.fn().mockResolvedValue({
          collectiviteId,
          identifiantReferentiel,
          groupementId: null,
          periodicite: 'annuelle',
        }),
      };
      const { getUserPermissionsService, permissionService } =
        createAuthorizationDependencies();
      const service = new UpdateIndicateurService(
        transactionManager as never,
        repository as never,
        getUserPermissionsService as never,
        permissionService as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        indicateurLockRepository as never
      );
      await expect(
        service.updateIndicateur(
          {
            indicateurId: 42,
            collectiviteId: 1,
            indicateurFields: { periodicite: 'mensuelle' } as never,
          },
          { user }
        )
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(transactionManager.executeSingle).not.toHaveBeenCalled();
    }
  );
});

describe('UpdateIndicateurService — groupement', () => {
  function setup() {
    const tx = { name: 'shared-definition-tx' };
    const indicateur = {
      collectiviteId: null,
      identifiantReferentiel: 'sydev_1',
      groupementId: 99,
      periodicite: 'annuelle' as const,
    };
    const transactionManager = {
      executeSingle: vi.fn(
        (operation: (transaction: typeof tx) => Promise<unknown>) =>
          operation(tx)
      ),
    };
    const repository = {
      getIndicateurNature: vi.fn().mockResolvedValue(indicateur),
      lockIndicateurNature: vi.fn().mockResolvedValue(indicateur),
      lockGroupementMembership: vi.fn().mockResolvedValue(true),
      upsertCollectiviteFields: vi.fn().mockResolvedValue(undefined),
      updateIndicateurPerso: vi.fn().mockResolvedValue(true),
      touchIndicateurs: vi.fn().mockResolvedValue(undefined),
    };
    const permissions = {
      roles: [],
      permissions: [],
      collectivites: [
        {
          collectiviteId: 1,
          permissions: ['indicateurs.indicateurs.update'],
          audits: [],
        },
      ],
    };
    const getUserPermissionsService = {
      getUserRolesAndPermissions: vi.fn().mockResolvedValue({
        success: true,
        data: permissions,
      }),
    };
    const permissionService = {
      isApiKeyAllowed: vi.fn().mockReturnValue(success(undefined)),
      throwForbiddenException: vi.fn(() => {
        throw new ForbiddenException();
      }),
    };
    const fiches = {
      upsertIndicateurFiches: vi.fn().mockResolvedValue(success(undefined)),
    };
    const pilotes = {
      listIndicateurPilotes: vi.fn().mockResolvedValue([{ userId: user.id }]),
      upsertIndicateurPilotes: vi.fn().mockResolvedValue(undefined),
    };
    const services = {
      upsertIndicateurServices: vi.fn().mockResolvedValue(undefined),
    };
    const thematiques = {
      upsertIndicateurThematiques: vi.fn().mockResolvedValue(undefined),
    };
    const service = new UpdateIndicateurService(
      transactionManager as never,
      repository as never,
      getUserPermissionsService as never,
      permissionService as never,
      fiches as never,
      pilotes as never,
      services as never,
      thematiques as never,
      indicateurLockRepository as never
    );
    const input = {
      indicateurId: 42,
      collectiviteId: 1,
      indicateurFields: { estFavori: true },
    };
    return {
      service,
      input,
      tx,
      definition: indicateur,
      repository,
      transactionManager,
      permissions,
      getUserPermissionsService,
      permissionService,
      fiches,
      pilotes,
      services,
      thematiques,
    };
  }

  it('autorise les personnalisations locales du membre', async () => {
    const h = setup();
    await h.service.updateIndicateur(
      {
        ...h.input,
        indicateurFields: {
          commentaire: 'Méthode locale',
          estFavori: true,
          estConfidentiel: true,
          isApplicable: false,
          ficheIds: [11],
          pilotes: [{ userId: user.id }],
          services: [{ id: 12 }],
        },
      },
      { user }
    );

    expect(h.repository.lockGroupementMembership).toHaveBeenCalledWith(
      { groupementId: 99, collectiviteId: 1 },
      h.tx
    );
    expect(
      h.getUserPermissionsService.getUserRolesAndPermissions
    ).toHaveBeenLastCalledWith({ userId: user.id, tx: h.tx });
    expect(h.repository.upsertCollectiviteFields).toHaveBeenCalledWith(
      {
        indicateurId: 42,
        collectiviteId: 1,
        commentaire: 'Méthode locale',
        favoris: true,
        confidentiel: true,
        isApplicable: false,
        modifiedBy: user.id,
      },
      h.tx
    );
    expect(h.fiches.upsertIndicateurFiches).toHaveBeenCalledWith(
      { indicateurId: 42, collectiviteId: 1, ficheIds: [11] },
      { user, tx: h.tx }
    );
    expect(h.pilotes.upsertIndicateurPilotes).toHaveBeenCalledWith(
      { indicateurId: 42, collectiviteId: 1, pilotes: [{ userId: user.id }] },
      h.tx
    );
    expect(h.services.upsertIndicateurServices).toHaveBeenCalledWith(
      { indicateurId: 42, collectiviteId: 1, serviceIds: [12] },
      h.tx
    );
    expect(h.repository.updateIndicateurPerso).not.toHaveBeenCalled();
    expect(h.thematiques.upsertIndicateurThematiques).not.toHaveBeenCalled();
  });

  it('refuse un non-membre avant toute écriture', async () => {
    const h = setup();
    h.repository.lockGroupementMembership.mockResolvedValue(false);
    await expect(
      h.service.updateIndicateur(h.input, { user })
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(h.repository.upsertCollectiviteFields).not.toHaveBeenCalled();
    expect(h.repository.touchIndicateurs).not.toHaveBeenCalled();
  });

  it.each([{ titre: 'Autre titre' }, { unite: 'kg' }, { thematiques: [] }])(
    'refuse les champs globaux d’un prédéfini de groupement : %j',
    async (fields) => {
      const h = setup();
      await expect(
        h.service.updateIndicateur(
          { ...h.input, indicateurFields: { ...fields, estFavori: true } },
          { user }
        )
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(h.transactionManager.executeSingle).not.toHaveBeenCalled();
    }
  );

  it('refuse un changement de périodicité sur un prédéfini de groupement', async () => {
    const h = setup();
    await expect(
      h.service.updateIndicateur(
        { ...h.input, indicateurFields: { periodicite: 'mensuelle' } as never },
        { user }
      )
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(h.transactionManager.executeSingle).not.toHaveBeenCalled();
  });

  it('ne vérifie plus l’appartenance quand le groupement a disparu avant le verrouillage', async () => {
    const h = setup();
    h.repository.lockIndicateurNature.mockResolvedValue({
      ...h.definition,
      groupementId: null,
    });
    await h.service.updateIndicateur(h.input, { user });
    expect(h.repository.lockGroupementMembership).not.toHaveBeenCalled();
    expect(h.repository.upsertCollectiviteFields).toHaveBeenCalledOnce();
  });

  it('vérifie le groupement courant après verrouillage de la définition', async () => {
    const h = setup();
    h.repository.lockIndicateurNature.mockResolvedValue({
      ...h.definition,
      groupementId: 100,
    });
    h.repository.lockGroupementMembership.mockResolvedValue(false);
    await expect(
      h.service.updateIndicateur(h.input, { user })
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(h.repository.lockGroupementMembership).toHaveBeenCalledWith(
      { groupementId: 100, collectiviteId: 1 },
      h.tx
    );
    expect(h.repository.upsertCollectiviteFields).not.toHaveBeenCalled();
  });

  it('refuse les permissions retirées avant la transaction', async () => {
    const h = setup();
    h.getUserPermissionsService.getUserRolesAndPermissions
      .mockResolvedValueOnce({ success: true, data: h.permissions })
      .mockResolvedValueOnce({
        success: true,
        data: { roles: [], permissions: [], collectivites: [] },
      });
    await expect(
      h.service.updateIndicateur(h.input, { user })
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(
      h.getUserPermissionsService.getUserRolesAndPermissions
    ).toHaveBeenLastCalledWith({ userId: user.id, tx: h.tx });
    expect(h.repository.upsertCollectiviteFields).not.toHaveBeenCalled();
  });

  it('autorise un pilote dans la collectivité membre et transmet la transaction', async () => {
    const h = setup();
    h.permissions.collectivites[0].permissions = [
      'indicateurs.indicateurs.update_piloted_by_me',
    ];
    await h.service.updateIndicateur(h.input, { user });
    expect(h.pilotes.listIndicateurPilotes).toHaveBeenLastCalledWith(
      { indicateurId: 42, collectiviteId: 1, user },
      h.tx
    );
    expect(h.repository.upsertCollectiviteFields).toHaveBeenCalledOnce();
  });
});

describe('UpdateIndicateurService — unité d’un groupe', () => {
  function setup({
    parentId = null,
    hasChildren = false,
  }: {
    parentId?: number | null;
    hasChildren?: boolean;
  } = {}) {
    const tx = { name: 'unite-tx' };
    const events: string[] = [];
    const indicateur = {
      collectiviteId: 1,
      identifiantReferentiel: null,
      groupementId: null,
    };
    const transactionManager = {
      executeSingle: vi.fn(
        (operation: (transaction: typeof tx) => Promise<unknown>) =>
          operation(tx)
      ),
    };
    const repository = {
      getIndicateurNature: vi.fn().mockResolvedValue(indicateur),
      lockIndicateurNature: vi.fn(async () => {
        events.push('lock-row');
        return indicateur;
      }),
      getParentInGroup: vi.fn().mockResolvedValue({
        id: 42,
        collectiviteId: 1,
        unite: 'kg',
        periodicite: 'annuelle',
        parentId,
        hasChildren,
      }),
      updateIndicateurPerso: vi.fn().mockResolvedValue(true),
      updateSousIndicateursUnite: vi.fn().mockResolvedValue(undefined),
      touchIndicateurs: vi.fn().mockResolvedValue(undefined),
    };
    const lockRepository = {
      lockForIndicateurMutation: vi.fn(async () => {
        events.push('lock-graph');
      }),
    };
    const { getUserPermissionsService, permissionService } =
      createAuthorizationDependencies();
    const service = new UpdateIndicateurService(
      transactionManager as never,
      repository as never,
      getUserPermissionsService as never,
      permissionService as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      lockRepository as never
    );
    return { service, repository, lockRepository, events };
  }

  const changeUnite = (unite: string) => ({
    indicateurId: 42,
    collectiviteId: 1,
    indicateurFields: { unite },
  });

  it('modifie l’unité d’un indicateur autonome après avoir verrouillé le graphe puis la ligne', async () => {
    const { service, repository, events } = setup();

    await expect(
      service.updateIndicateur(changeUnite('t'), { user })
    ).resolves.toEqual(success(undefined));

    expect(events).toEqual(['lock-graph', 'lock-row']);
    expect(repository.updateIndicateurPerso).toHaveBeenCalledOnce();
  });

  it('propage la nouvelle unité d’un parent à ses sous-indicateurs', async () => {
    const { service, repository } = setup({ hasChildren: true });

    await expect(
      service.updateIndicateur(changeUnite('t'), { user })
    ).resolves.toEqual(success(undefined));

    expect(repository.updateIndicateurPerso).toHaveBeenCalledOnce();
    expect(repository.updateSousIndicateursUnite).toHaveBeenCalledWith(
      { parentId: 42, collectiviteId: 1, unite: 't' },
      expect.anything()
    );
  });

  it('ne propage rien pour un indicateur sans sous-indicateur', async () => {
    const { service, repository } = setup();

    await service.updateIndicateur(changeUnite('t'), { user });

    expect(repository.updateSousIndicateursUnite).not.toHaveBeenCalled();
  });

  it('refuse de changer l’unité d’un sous-indicateur', async () => {
    const { service, repository } = setup({ parentId: 7 });

    await expect(
      service.updateIndicateur(changeUnite('t'), { user })
    ).resolves.toEqual(failure('SOUS_INDICATEUR_UNITE_LOCKED'));

    expect(repository.updateIndicateurPerso).not.toHaveBeenCalled();
    expect(repository.updateSousIndicateursUnite).not.toHaveBeenCalled();
  });

  it('accepte l’unité inchangée d’un sous-indicateur', async () => {
    const { service, repository } = setup({ parentId: 7 });

    await expect(
      service.updateIndicateur(changeUnite('kg'), { user })
    ).resolves.toEqual(success(undefined));

    expect(repository.updateIndicateurPerso).toHaveBeenCalledOnce();
  });

  it('ne verrouille pas le graphe quand l’unité n’est pas modifiée', async () => {
    const { service, lockRepository } = setup({ hasChildren: true });

    await service.updateIndicateur(
      {
        indicateurId: 42,
        collectiviteId: 1,
        indicateurFields: { titre: 'Nouveau titre' },
      },
      { user }
    );

    expect(lockRepository.lockForIndicateurMutation).not.toHaveBeenCalled();
  });
});
