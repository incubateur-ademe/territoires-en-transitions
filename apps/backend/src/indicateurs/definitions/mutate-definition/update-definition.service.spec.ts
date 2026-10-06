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
import { UpdateDefinitionService } from './update-definition.service';

const user = {
  id: '00000000-0000-0000-0000-000000000001',
  role: AuthRole.AUTHENTICATED,
} as AuthenticatedUser;

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

describe('UpdateDefinitionService', () => {
  it('returns an API-key denial before reading or writing the definition', async () => {
    const transactionManager = { executeSingle: vi.fn() };
    const repository = { getDefinitionOwnership: vi.fn() };
    const { getUserPermissionsService, permissionService } =
      createAuthorizationDependencies();
    permissionService.isApiKeyAllowed.mockReturnValue(failure('UNAUTHORIZED'));
    const service = new UpdateDefinitionService(
      transactionManager as never,
      repository as never,
      getUserPermissionsService as never,
      permissionService as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );

    await expect(
      service.updateDefinition(
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
    expect(repository.getDefinitionOwnership).not.toHaveBeenCalled();
    expect(
      getUserPermissionsService.getUserRolesAndPermissions
    ).not.toHaveBeenCalled();
    expect(transactionManager.executeSingle).not.toHaveBeenCalled();
  });

  it("refuse l'identifiant d'un indicateur d'une autre collectivité avant l'autorisation", async () => {
    const transactionManager = { executeSingle: vi.fn() };
    const repository = {
      getDefinitionOwnership: vi.fn().mockResolvedValue({
        collectiviteId: 2,
        groupementId: null,
        periodicite: 'annuelle',
      }),
    };
    const { getUserPermissionsService, permissionService } =
      createAuthorizationDependencies();
    const service = new UpdateDefinitionService(
      transactionManager as never,
      repository as never,
      getUserPermissionsService as never,
      permissionService as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );

    await expect(
      service.updateDefinition(
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

  it("refuse la mutation des thématiques globales d'un indicateur prédéfini", async () => {
    const transactionManager = { executeSingle: vi.fn() };
    const repository = {
      getDefinitionOwnership: vi.fn().mockResolvedValue({
        collectiviteId: null,
        groupementId: null,
        periodicite: 'annuelle',
      }),
    };
    const { getUserPermissionsService, permissionService } =
      createAuthorizationDependencies();
    const service = new UpdateDefinitionService(
      transactionManager as never,
      repository as never,
      getUserPermissionsService as never,
      permissionService as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );

    await expect(
      service.updateDefinition(
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
      getDefinitionOwnership: vi.fn().mockResolvedValue({
        collectiviteId: 1,
        groupementId: null,
        periodicite: 'annuelle',
      }),
      lockDefinitionOwnership: vi.fn().mockResolvedValue({
        collectiviteId: 1,
        groupementId: null,
        periodicite: 'annuelle',
      }),
      touchDefinitions: vi.fn().mockResolvedValue(undefined),
    };
    const { getUserPermissionsService, permissionService } =
      createAuthorizationDependencies();
    const handleDefinitionFichesService = {
      upsertIndicateurFiches: vi.fn().mockResolvedValue(undefined),
    };
    const handleDefinitionPilotesService = {
      upsertIndicateurPilotes: vi.fn().mockResolvedValue(undefined),
    };
    const handleDefinitionServicesService = {
      upsertIndicateurServices: vi.fn().mockResolvedValue(undefined),
    };
    const handleDefinitionThematiquesService = {
      upsertIndicateurThematiques: vi.fn().mockResolvedValue(undefined),
    };
    const service = new UpdateDefinitionService(
      transactionManager as never,
      repository as never,
      getUserPermissionsService as never,
      permissionService as never,
      handleDefinitionFichesService as never,
      handleDefinitionPilotesService as never,
      handleDefinitionServicesService as never,
      handleDefinitionThematiquesService as never
    );

    await service.updateDefinition(
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
      handleDefinitionFichesService.upsertIndicateurFiches
    ).toHaveBeenCalledWith(
      { indicateurId: 42, collectiviteId: 1, ficheIds: [11] },
      { user, tx }
    );
    expect(
      handleDefinitionPilotesService.upsertIndicateurPilotes
    ).toHaveBeenCalledWith(
      {
        indicateurId: 42,
        collectiviteId: 1,
        pilotes: [{ userId: user.id }],
      },
      tx
    );
    expect(
      handleDefinitionServicesService.upsertIndicateurServices
    ).toHaveBeenCalledWith(
      { indicateurId: 42, collectiviteId: 1, serviceIds: [12] },
      tx
    );
    expect(
      handleDefinitionThematiquesService.upsertIndicateurThematiques
    ).toHaveBeenCalledWith({ indicateurId: 42, thematiqueIds: [13] }, tx);
    expect(repository.touchDefinitions).toHaveBeenCalledWith(
      {
        indicateurIds: [42],
        collectiviteId: 1,
        modifiedBy: user.id,
      },
      tx
    );
    expect(transactionManager.executeSingle).toHaveBeenCalledOnce();
  });

  it.each([null, 1])(
    'refuse une modification de périodicité pour la définition de collectivité %s',
    async (collectiviteId) => {
      const transactionManager = { executeSingle: vi.fn() };
      const repository = {
        getDefinitionOwnership: vi.fn().mockResolvedValue({
          collectiviteId,
          groupementId: null,
          periodicite: 'annuelle',
        }),
      };
      const { getUserPermissionsService, permissionService } =
        createAuthorizationDependencies();
      const service = new UpdateDefinitionService(
        transactionManager as never,
        repository as never,
        getUserPermissionsService as never,
        permissionService as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never
      );
      await expect(
        service.updateDefinition(
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

describe('UpdateDefinitionService — groupement', () => {
  function setup(ownerId: number | null = 2) {
    const tx = { name: 'shared-definition-tx' };
    const definition = {
      collectiviteId: ownerId,
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
      getDefinitionOwnership: vi.fn().mockResolvedValue(definition),
      lockDefinitionOwnership: vi.fn().mockResolvedValue(definition),
      lockGroupementMembership: vi.fn().mockResolvedValue(true),
      upsertCollectiviteFields: vi.fn().mockResolvedValue(undefined),
      updatePersonalizedDefinition: vi.fn().mockResolvedValue(true),
      touchDefinitions: vi.fn().mockResolvedValue(undefined),
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
      upsertIndicateurFiches: vi.fn().mockResolvedValue(undefined),
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
    const service = new UpdateDefinitionService(
      transactionManager as never,
      repository as never,
      getUserPermissionsService as never,
      permissionService as never,
      fiches as never,
      pilotes as never,
      services as never,
      thematiques as never
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
      definition,
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

  it.each([2, null])(
    'autorise les personnalisations locales du membre, propriétaire %s',
    async (ownerId) => {
      const h = setup(ownerId);
      await h.service.updateDefinition(
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
      expect(h.repository.updatePersonalizedDefinition).not.toHaveBeenCalled();
      expect(h.thematiques.upsertIndicateurThematiques).not.toHaveBeenCalled();
    }
  );

  it.each([2, null])(
    'refuse un non-membre avant toute écriture, propriétaire %s',
    async (ownerId) => {
      const h = setup(ownerId);
      h.repository.lockGroupementMembership.mockResolvedValue(false);
      await expect(
        h.service.updateDefinition(h.input, { user })
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(h.repository.upsertCollectiviteFields).not.toHaveBeenCalled();
      expect(h.repository.touchDefinitions).not.toHaveBeenCalled();
    }
  );

  it.each([{ titre: 'Autre titre' }, { unite: 'kg' }, { thematiques: [] }])(
    'refuse les champs globaux du non-propriétaire : %j',
    async (fields) => {
      const h = setup();
      await expect(
        h.service.updateDefinition(
          { ...h.input, indicateurFields: { ...fields, estFavori: true } },
          { user }
        )
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(h.transactionManager.executeSingle).not.toHaveBeenCalled();
    }
  );

  it('conserve la modification des champs globaux du propriétaire sans appartenance au groupement', async () => {
    const h = setup(1);
    h.repository.lockGroupementMembership.mockResolvedValue(false);
    await h.service.updateDefinition(
      {
        ...h.input,
        indicateurFields: {
          titre: 'Titre propriétaire',
          unite: 'kg',
          thematiques: [],
        },
      },
      { user }
    );
    expect(h.repository.lockGroupementMembership).not.toHaveBeenCalled();
    expect(h.repository.updatePersonalizedDefinition).toHaveBeenCalledWith(
      {
        indicateurId: 42,
        collectiviteId: 1,
        titre: 'Titre propriétaire',
        unite: 'kg',
      },
      h.tx
    );
    expect(h.thematiques.upsertIndicateurThematiques).toHaveBeenCalledWith(
      { indicateurId: 42, thematiqueIds: [] },
      h.tx
    );
  });

  it('refuse un changement de périodicité sur un indicateur partagé', async () => {
    const h = setup();
    await expect(
      h.service.updateDefinition(
        { ...h.input, indicateurFields: { periodicite: 'mensuelle' } as never },
        { user }
      )
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(h.transactionManager.executeSingle).not.toHaveBeenCalled();
  });

  it('refuse une définition qui a perdu son partage avant le verrouillage', async () => {
    const h = setup();
    h.repository.lockDefinitionOwnership.mockResolvedValue({
      ...h.definition,
      groupementId: null,
    });
    await expect(
      h.service.updateDefinition(h.input, { user })
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(h.repository.upsertCollectiviteFields).not.toHaveBeenCalled();
  });

  it('vérifie le groupement courant après verrouillage de la définition', async () => {
    const h = setup();
    h.repository.lockDefinitionOwnership.mockResolvedValue({
      ...h.definition,
      groupementId: 100,
    });
    h.repository.lockGroupementMembership.mockResolvedValue(false);
    await expect(
      h.service.updateDefinition(h.input, { user })
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(h.repository.lockGroupementMembership).toHaveBeenCalledWith(
      { groupementId: 100, collectiviteId: 1 },
      h.tx
    );
    expect(h.repository.upsertCollectiviteFields).not.toHaveBeenCalled();
  });

  it('revérifie le propriétaire des champs globaux sous verrou', async () => {
    const h = setup(1);
    h.repository.lockDefinitionOwnership.mockResolvedValue({
      ...h.definition,
      collectiviteId: 2,
    });
    await expect(
      h.service.updateDefinition(
        { ...h.input, indicateurFields: { titre: 'Titre' } },
        { user }
      )
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(h.repository.updatePersonalizedDefinition).not.toHaveBeenCalled();
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
      h.service.updateDefinition(h.input, { user })
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
    await h.service.updateDefinition(h.input, { user });
    expect(h.pilotes.listIndicateurPilotes).toHaveBeenLastCalledWith(
      { indicateurId: 42, collectiviteId: 1, user },
      h.tx
    );
    expect(h.repository.upsertCollectiviteFields).toHaveBeenCalledOnce();
  });
});
