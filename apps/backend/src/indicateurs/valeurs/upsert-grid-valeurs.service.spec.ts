import {
  AuthenticatedUser,
  AuthRole,
} from '@tet/backend/users/models/auth.models';
import { ForbiddenException } from '@nestjs/common';
import { IndicateurPeriods, IndicateurValeur } from '@tet/domain/indicateurs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpsertGridValeursService } from './upsert-grid-valeurs.service';
import { UserIndicateurValeurNotAllowedException } from './user-indicateur-valeur.errors';

const user = {
  id: '00000000-0000-0000-0000-000000000001',
  role: AuthRole.AUTHENTICATED,
} as AuthenticatedUser;

const indicateur = {
  id: 10,
  periodicite: 'mensuelle',
  precision: 0,
  sansValeurUtilisateur: false,
  pilotes: [],
};

const period = IndicateurPeriods.parse('mensuelle', '2026-02');

const saved = {
  id: 1,
  indicateurId: 10,
  collectiviteId: 1,
  dateValeur: '2026-02-01',
  resultat: 2,
  objectif: 3,
  metadonneeId: null,
} as IndicateurValeur;

describe('UpsertGridValeursService', () => {
  const repository = { upsert: vi.fn() };
  const lockRepository = { lock: vi.fn() };
  const definitionLockRepository = { lockDefinitions: vi.fn() };
  const crudValeursService = {
    canMutateValeurs: vi.fn(),
    upsertIndicateurValeurs: vi.fn(),
  };
  const listIndicateursService = { listIndicateurs: vi.fn() };
  const updateDefinitionService = {
    updateDefinitionsModifiedFields: vi.fn(),
  };
  const computeValeursService = {
    updateCalculatedIndicateurValeurs: vi.fn(),
  };
  const tx = {};
  const transactionManager = {
    executeSingle: vi.fn((callback) => callback(tx)),
  };

  const service = new UpsertGridValeursService(
    transactionManager as never,
    crudValeursService as never,
    listIndicateursService as never,
    updateDefinitionService as never,
    computeValeursService as never,
    lockRepository as never,
    definitionLockRepository as never,
    repository as never
  );

  beforeEach(() => {
    vi.clearAllMocks();
    listIndicateursService.listIndicateurs.mockResolvedValue({
      data: [indicateur],
    });
    crudValeursService.canMutateValeurs.mockResolvedValue(undefined);
    crudValeursService.upsertIndicateurValeurs.mockResolvedValue([]);
    lockRepository.lock.mockResolvedValue(undefined);
    definitionLockRepository.lockDefinitions.mockResolvedValue([indicateur]);
    repository.upsert.mockResolvedValue([saved]);
    updateDefinitionService.updateDefinitionsModifiedFields.mockResolvedValue(
      undefined
    );
    computeValeursService.updateCalculatedIndicateurValeurs.mockResolvedValue(
      []
    );
  });

  it('fusionne les champs d une période et applique la précision avant le bulk upsert', async () => {
    const result = await service.upsertGridValeurs(
      {
        collectiviteId: 1,
        valeurs: [
          {
            indicateurId: 10,
            period,
            resultat: 1.6,
          },
          {
            indicateurId: 10,
            period,
            objectif: 3.2,
          },
        ],
      },
      { user }
    );

    expect(result).toEqual({ success: true, data: [saved] });
    expect(repository.upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          indicateurId: 10,
          dateValeur: '2026-02-01',
          resultat: 2,
          objectif: 3,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
        }),
      ],
      tx
    );
    expect(lockRepository.lock).toHaveBeenCalledWith(
      [expect.objectContaining({ dateValeur: '2026-02-01' })],
      tx
    );
    expect(lockRepository.lock.mock.invocationCallOrder[0]).toBeLessThan(
      repository.upsert.mock.invocationCallOrder[0]
    );
    expect(
      definitionLockRepository.lockDefinitions.mock.invocationCallOrder[0]
    ).toBeLessThan(lockRepository.lock.mock.invocationCallOrder[0]);
    expect(crudValeursService.canMutateValeurs).toHaveBeenCalledOnce();
    expect(listIndicateursService.listIndicateurs).toHaveBeenCalledOnce();
    expect(
      updateDefinitionService.updateDefinitionsModifiedFields
    ).toHaveBeenCalledWith(
      { indicateurIds: [10], collectiviteId: 1, user },
      tx
    );
  });

  it('rejette une période incompatible avec la définition avant toute écriture', async () => {
    const result = await service.upsertGridValeurs(
      {
        collectiviteId: 1,
        valeurs: [
          {
            indicateurId: 10,
            period: IndicateurPeriods.parse('annuelle', '2026'),
            resultat: 1,
          },
        ],
      },
      { user }
    );

    expect(result).toEqual({
      success: false,
      error: 'INVALID_GRID_VALEUR',
    });
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it('revalide la périodicité sous verrou avant toute écriture', async () => {
    definitionLockRepository.lockDefinitions.mockResolvedValue([
      { ...indicateur, periodicite: 'annuelle' },
    ]);

    const result = await service.upsertGridValeurs(
      {
        collectiviteId: 1,
        valeurs: [{ indicateurId: 10, period, resultat: 1 }],
      },
      { user }
    );

    expect(result).toEqual({
      success: false,
      error: 'INVALID_GRID_VALEUR',
    });
    expect(definitionLockRepository.lockDefinitions).toHaveBeenCalledWith(
      [10],
      tx
    );
    expect(lockRepository.lock).not.toHaveBeenCalled();
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it('rejette atomiquement le lot si une définition est introuvable', async () => {
    listIndicateursService.listIndicateurs.mockResolvedValue({ data: [] });

    const result = await service.upsertGridValeurs(
      {
        collectiviteId: 1,
        valeurs: [
          {
            indicateurId: 404,
            period,
            resultat: 1,
          },
        ],
      },
      { user }
    );

    expect(result).toEqual({ success: false, error: 'NOT_FOUND' });
    expect(crudValeursService.canMutateValeurs).not.toHaveBeenCalled();
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it("rejette tout le lot si un indicateur n'accepte pas de valeur utilisateur", async () => {
    listIndicateursService.listIndicateurs.mockResolvedValue({
      data: [{ ...indicateur, sansValeurUtilisateur: true }],
    });
    crudValeursService.canMutateValeurs.mockRejectedValue(
      new UserIndicateurValeurNotAllowedException([10])
    );

    const result = await service.upsertGridValeurs(
      {
        collectiviteId: 1,
        valeurs: [
          {
            indicateurId: 10,
            period,
            resultat: 1,
          },
        ],
      },
      { user }
    );

    expect(result).toMatchObject({
      success: false,
      error: 'USER_VALUE_NOT_ALLOWED',
      cause: expect.any(UserIndicateurValeurNotAllowedException),
    });
    expect(crudValeursService.canMutateValeurs).toHaveBeenCalledOnce();
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it("revalide sous verrou qu'un indicateur accepte les valeurs utilisateur", async () => {
    definitionLockRepository.lockDefinitions.mockResolvedValue([
      { ...indicateur, sansValeurUtilisateur: true },
    ]);

    const result = await service.upsertGridValeurs(
      {
        collectiviteId: 1,
        valeurs: [{ indicateurId: 10, period, resultat: 1 }],
      },
      { user }
    );

    expect(result).toMatchObject({
      success: false,
      error: 'USER_VALUE_NOT_ALLOWED',
      cause: expect.any(UserIndicateurValeurNotAllowedException),
    });
    expect(definitionLockRepository.lockDefinitions).toHaveBeenCalledWith(
      [10],
      tx
    );
    expect(lockRepository.lock).not.toHaveBeenCalled();
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it("préserve le refus de portée d'une clé d'API avant toute écriture", async () => {
    const scopeError = new ForbiddenException(
      "Droits insuffisants, la clé d'api n'a pas l'autorisation indicateurs.valeurs.mutate."
    );
    crudValeursService.canMutateValeurs.mockRejectedValue(scopeError);

    const result = await service.upsertGridValeurs(
      {
        collectiviteId: 1,
        valeurs: [
          {
            indicateurId: 10,
            period,
            resultat: 1,
          },
        ],
      },
      { user }
    );

    expect(result).toEqual({
      success: false,
      error: 'UNAUTHORIZED',
      cause: scopeError,
    });
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it('écrit les valeurs calculées dans la même transaction', async () => {
    const calculated = [
      {
        indicateurId: 11,
        collectiviteId: 1,
        dateValeur: '2026-02-01',
        resultat: 4,
      },
    ];
    computeValeursService.updateCalculatedIndicateurValeurs.mockResolvedValue(
      calculated
    );

    const result = await service.upsertGridValeurs(
      {
        collectiviteId: 1,
        valeurs: [
          {
            indicateurId: 10,
            period,
            resultat: 2,
          },
        ],
      },
      { user }
    );

    expect(result).toEqual({ success: true, data: [saved] });
    expect(crudValeursService.upsertIndicateurValeurs).toHaveBeenCalledWith(
      calculated,
      { user, isUserTrusted: true, tx }
    );
  });

  it('retourne un échec si le recalcul transactionnel échoue', async () => {
    computeValeursService.updateCalculatedIndicateurValeurs.mockRejectedValue(
      new Error('recompute failed')
    );

    const result = await service.upsertGridValeurs(
      {
        collectiviteId: 1,
        valeurs: [
          {
            indicateurId: 10,
            period,
            resultat: 2,
          },
        ],
      },
      { user }
    );

    expect(result).toMatchObject({
      success: false,
      error: 'DATABASE_ERROR',
      cause: expect.any(Error),
    });
  });
});
