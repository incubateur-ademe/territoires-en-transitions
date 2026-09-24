import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  AuthRole,
  type AuthenticatedUser,
} from '@tet/backend/users/models/auth.models';
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
      assertApiKeyPermission: vi.fn(),
    },
  };
}

describe('UpdateDefinitionService', () => {
  it("refuse l'identifiant d'un indicateur d'une autre collectivité avant l'autorisation", async () => {
    const transactionManager = { executeSingle: vi.fn() };
    const repository = {
      getDefinitionOwnership: vi.fn().mockResolvedValue({
        collectiviteId: 2,
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
        user
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
        user
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
        periodicite: 'annuelle',
      }),
      lockDefinitionOwnership: vi.fn().mockResolvedValue({
        collectiviteId: 1,
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
      user
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
        getDefinitionOwnership: vi
          .fn()
          .mockResolvedValue({ collectiviteId, periodicite: 'annuelle' }),
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
          user
        )
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(transactionManager.executeSingle).not.toHaveBeenCalled();
    }
  );
});
