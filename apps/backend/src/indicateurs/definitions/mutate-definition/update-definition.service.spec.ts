import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
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
    const definitionLockRepository = {
      lockForDefinitionMutation: vi.fn().mockResolvedValue(undefined),
    };
    const service = new UpdateDefinitionService(
      transactionManager as never,
      repository as never,
      getUserPermissionsService as never,
      permissionService as never,
      handleDefinitionFichesService as never,
      handleDefinitionPilotesService as never,
      handleDefinitionServicesService as never,
      handleDefinitionThematiquesService as never,
      {} as never,
      definitionLockRepository as never
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
      tx
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

  it('évalue le rollout avant de prendre le verrou global', async () => {
    const events: string[] = [];
    const tx = { name: 'tx' };
    const transactionManager = {
      executeSingle: vi.fn(
        async (operation: (transaction: typeof tx) => Promise<unknown>) => {
          events.push('transaction-start');
          return operation(tx);
        }
      ),
    };
    const repository = {
      getDefinitionOwnership: vi.fn(async () => {
        events.push('preflight-definition-read');
        return { collectiviteId: 1, periodicite: 'annuelle' };
      }),
      lockDefinitionOwnership: vi.fn(async () => {
        events.push('locked-definition-read');
        return { collectiviteId: 1, periodicite: 'annuelle' };
      }),
      hasValeurs: vi.fn().mockResolvedValue(false),
      upsertCollectiviteFields: vi.fn(async () => {
        events.push('local-settings-update');
        return true;
      }),
      touchDefinitions: vi.fn().mockResolvedValue(undefined),
    };
    const { getUserPermissionsService, permissionService } =
      createAuthorizationDependencies();
    const periodiciteAvailabilityService = {
      checkAssignmentAvailable: vi.fn(async () => {
        events.push('rollout-check');
        return { success: true, data: undefined };
      }),
    };
    const definitionLockRepository = {
      lockForDefinitionMutation: vi.fn(async () => {
        events.push('graph-lock');
      }),
    };
    const service = new UpdateDefinitionService(
      transactionManager as never,
      repository as never,
      getUserPermissionsService as never,
      permissionService as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      periodiciteAvailabilityService as never,
      definitionLockRepository as never
    );

    await service.updateDefinition(
      {
        indicateurId: 42,
        collectiviteId: 1,
        indicateurFields: { periodicite: 'mensuelle' },
      },
      user
    );

    expect(events).toEqual([
      'preflight-definition-read',
      'rollout-check',
      'transaction-start',
      'graph-lock',
      'locked-definition-read',
      'local-settings-update',
    ]);
  });

  it('refuse une migration si la périodicité change entre le préflight et le verrou', async () => {
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
        periodicite: 'mensuelle',
      }),
      hasValeurs: vi.fn(),
      updatePersonalizedDefinition: vi.fn(),
    };
    const { getUserPermissionsService, permissionService } =
      createAuthorizationDependencies();
    const periodiciteAvailabilityService = {
      checkAssignmentAvailable: vi
        .fn()
        .mockResolvedValue({ success: true, data: undefined }),
    };
    const definitionLockRepository = {
      lockForDefinitionMutation: vi.fn().mockResolvedValue(undefined),
    };
    const service = new UpdateDefinitionService(
      transactionManager as never,
      repository as never,
      getUserPermissionsService as never,
      permissionService as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      periodiciteAvailabilityService as never,
      definitionLockRepository as never
    );

    await expect(
      service.updateDefinition(
        {
          indicateurId: 42,
          collectiviteId: 1,
          indicateurFields: { periodicite: 'mensuelle' },
        },
        user
      )
    ).rejects.toBeInstanceOf(ConflictException);

    expect(
      periodiciteAvailabilityService.checkAssignmentAvailable
    ).toHaveBeenCalledWith(
      { periodicite: 'mensuelle', current: 'annuelle', collectiviteId: 1 },
      { user }
    );
    expect(
      definitionLockRepository.lockForDefinitionMutation
    ).toHaveBeenCalledWith(tx);
    expect(repository.hasValeurs).not.toHaveBeenCalled();
    expect(repository.updatePersonalizedDefinition).not.toHaveBeenCalled();
  });

  it.each(['recommandee', 'imposee'] as const)(
    'applies the %s catalogue policy to a collectivité preference',
    async (periodiciteMode) => {
      const tx = {};
      const definition = {
        collectiviteId: null,
        periodicite: 'annuelle',
        periodiciteMode,
      };
      const repository = {
        getDefinitionOwnership: vi.fn().mockResolvedValue(definition),
        lockDefinitionOwnership: vi.fn().mockResolvedValue(definition),
        upsertCollectiviteFields: vi.fn(),
        updatePersonalizedDefinition: vi.fn(),
      };
      const { getUserPermissionsService, permissionService } =
        createAuthorizationDependencies();
      const service = new UpdateDefinitionService(
        { executeSingle: (run: (tx: object) => unknown) => run(tx) } as never,
        repository as never,
        getUserPermissionsService as never,
        permissionService as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {
          checkAssignmentAvailable: vi
            .fn()
            .mockResolvedValue({ success: true }),
        } as never,
        { lockForDefinitionMutation: vi.fn() } as never
      );
      const input = {
        indicateurId: 42,
        collectiviteId: 17,
        indicateurFields: { periodicite: 'mensuelle' as const },
      };
      if (periodiciteMode === 'imposee') {
        await expect(service.updateDefinition(input, user)).rejects.toThrow(
          'imposée'
        );
        expect(repository.upsertCollectiviteFields).not.toHaveBeenCalled();
      } else {
        await service.updateDefinition(input, user);
        expect(repository.upsertCollectiviteFields).toHaveBeenCalledWith(
          expect.objectContaining({
            indicateurId: 42,
            collectiviteId: 17,
            periodicite: 'mensuelle',
          }),
          tx
        );
        await service.updateDefinition(
          { ...input, indicateurFields: { periodicite: null } },
          user
        );
        expect(repository.upsertCollectiviteFields).toHaveBeenLastCalledWith(
          expect.objectContaining({
            indicateurId: 42,
            collectiviteId: 17,
            periodicite: null,
          }),
          tx
        );
      }
      expect(repository.updatePersonalizedDefinition).not.toHaveBeenCalled();
    }
  );
});
