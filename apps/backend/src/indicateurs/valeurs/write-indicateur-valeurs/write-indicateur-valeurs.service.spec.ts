import { buildRequesterUser } from '@tet/backend/users/models/auth.models';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  IndicateurPeriodiciteEnum,
  IndicateurValeurCreate,
} from '@tet/domain/indicateurs';
import { IndicateurValeursError } from '../indicateur-valeurs.errors';
import { describe, expect, it, vi } from 'vitest';
import { IndicateurLockRepository } from '../../indicateur/indicateur-lock.repository';
import { IndicateurValeurLockRepository } from '../indicateur-valeur-lock.repository';
import { IndicateurValeursRepository } from '../indicateur-valeurs.repository';
import { UpsertValeurIndicateur } from './upsert-valeur-indicateur.request';
import {
  PreparedIndicateurValeurs,
  ValidateIndicateurValeursWriteService,
} from './validate-indicateur-valeurs-write.service';
import { WriteIndicateurValeursService } from './write-indicateur-valeurs.service';

const collectiviteId = 3;
const indicateurId = 10;
const tx = {} as Transaction;
const user = buildRequesterUser('00000000-0000-0000-0000-000000000001');

const indicateurAnnuel = {
  id: indicateurId,
  periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
  precision: 2,
  sansValeurUtilisateur: false,
};

const toWriteServiceWithMocks = ({
  lockedIndicateurs = [indicateurAnnuel],
  lockResult = success(lockedIndicateurs),
  existing = null,
  stored = null,
  validation = success({ [indicateurId]: indicateurAnnuel }),
  upsertWithoutMetadata = vi.fn().mockResolvedValue([]),
  upsertUserValeur = vi.fn().mockResolvedValue(stored),
  lock = vi.fn().mockResolvedValue(undefined),
  listIndicateurValeurs = vi.fn().mockResolvedValue(success([])),
}: {
  lockedIndicateurs?: unknown[];
  lockResult?: Result<unknown[], 'DATABASE_ERROR'>;
  existing?: unknown;
  stored?: unknown;
  validation?: Result<unknown, IndicateurValeursError>;
  upsertWithoutMetadata?: ReturnType<typeof vi.fn>;
  upsertUserValeur?: ReturnType<typeof vi.fn>;
  lock?: ReturnType<typeof vi.fn>;
  listIndicateurValeurs?: ReturnType<typeof vi.fn>;
}) => {
  const repository = {
    findUserValeur: vi.fn().mockResolvedValue(existing),
    updateUserValeur: vi.fn().mockResolvedValue(stored),
    upsertUserValeur,
    upsertValeursWithoutMetadata: upsertWithoutMetadata,
    listIndicateurValeurs,
    listMetadataSources: vi.fn().mockResolvedValue([]),
  } as unknown as IndicateurValeursRepository;
  const indicateurLockRepository = {
    lockIndicateurs: vi.fn().mockResolvedValue(lockResult),
  } as unknown as IndicateurLockRepository;
  const lockRepository = {
    lock,
  } as unknown as IndicateurValeurLockRepository;
  const validationService = {
    validate: vi.fn().mockResolvedValue(validation),
  } as unknown as ValidateIndicateurValeursWriteService;
  return new WriteIndicateurValeursService(
    repository,
    validationService,
    indicateurLockRepository,
    lockRepository
  );
};

const toPrepared = (
  valeurs: Partial<IndicateurValeurCreate>[] = [{}]
): PreparedIndicateurValeurs =>
  ({
    valeurs: valeurs.map((valeur) => ({
      collectiviteId,
      indicateurId,
      dateValeur: '2026-01-01',
      periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
      resultat: 1,
      ...valeur,
    })),
  } as unknown as PreparedIndicateurValeurs);

const toData = (
  overrides: Partial<UpsertValeurIndicateur> = {}
): UpsertValeurIndicateur =>
  ({
    collectiviteId,
    indicateurId,
    dateValeur: '2026-01-01',
    resultat: 42,
    ...overrides,
  } as UpsertValeurIndicateur);

describe('WriteIndicateurValeursService.saveSingle', () => {
  it("refuse une valeur dont l'indicateur est introuvable", async () => {
    const result = await toWriteServiceWithMocks({
      lockedIndicateurs: [],
    }).saveSingle({ data: toData() }, { user, tx });

    expect(result).toMatchObject({
      success: false,
      error: 'INDICATEUR_NOT_AVAILABLE',
      cause: {
        message: `Indicateur definition not found for id ${indicateurId}`,
      },
    });
  });

  it('refuse une nouvelle valeur dont la périodicité diffère de celle de l’indicateur', async () => {
    const result = await toWriteServiceWithMocks({
      lockedIndicateurs: [
        {
          ...indicateurAnnuel,
          periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
        },
      ],
    }).saveSingle({ data: toData() }, { user, tx });

    expect(result).toMatchObject({
      success: false,
      error: 'PERIODICITE_MISMATCH',
      cause: {
        message: 'La valeur doit respecter la périodicité de déclaration',
      },
    });
  });

  it('refuse une nouvelle valeur sans date', async () => {
    const result = await toWriteServiceWithMocks({}).saveSingle(
      { data: toData({ dateValeur: undefined }) },
      { user, tx }
    );

    expect(result).toMatchObject({
      success: false,
      error: 'INVALID_VALUE',
      cause: { message: 'Une valeur ou une date est requise' },
    });
  });

  it('refuse la mise à jour d’une valeur existante dont la périodicité diffère de celle de l’indicateur', async () => {
    const result = await toWriteServiceWithMocks({
      existing: { id: 1, periodicite: IndicateurPeriodiciteEnum.MENSUELLE },
    }).saveSingle(
      { data: toData({ id: 1, dateValeur: undefined }) },
      { user, tx }
    );

    expect(result).toMatchObject({
      success: false,
      error: 'PERIODICITE_MISMATCH',
      cause: {
        message: 'La valeur doit respecter la périodicité de déclaration',
      },
    });
  });

  it('refuse la mise à jour d’une valeur existante avec une autre périodicité que celle demandée', async () => {
    const result = await toWriteServiceWithMocks({
      existing: { id: 1, periodicite: IndicateurPeriodiciteEnum.ANNUELLE },
    }).saveSingle(
      {
        data: toData({
          id: 1,
          dateValeur: undefined,
          periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
        }),
      },
      { user, tx }
    );

    expect(result).toMatchObject({
      success: false,
      error: 'PERIODICITE_MISMATCH',
      cause: {
        message:
          'La périodicité de la valeur ne correspond pas à la série demandée',
      },
    });
  });

  it('retourne undefined quand la valeur à mettre à jour n’existe pas', async () => {
    const result = await toWriteServiceWithMocks({ existing: null }).saveSingle(
      { data: toData({ id: 1, dateValeur: undefined }) },
      { user, tx }
    );

    expect(result).toEqual(success(undefined));
  });

  it('retourne la valeur mise à jour quand la valeur existante respecte la périodicité', async () => {
    const stored = { id: 1, collectiviteId, indicateurId, resultat: 42 };

    const result = await toWriteServiceWithMocks({
      existing: { id: 1, periodicite: IndicateurPeriodiciteEnum.ANNUELLE },
      stored,
    }).saveSingle(
      { data: toData({ id: 1, dateValeur: undefined }) },
      { user, tx }
    );

    expect(result).toEqual(success(stored));
  });

  it('retourne la valeur enregistrée pour une nouvelle valeur valide', async () => {
    const stored = { id: 5, collectiviteId, indicateurId, resultat: 42 };

    const result = await toWriteServiceWithMocks({ stored }).saveSingle(
      { data: toData() },
      { user, tx }
    );

    expect(result).toEqual(success(stored));
  });
});

describe('WriteIndicateurValeursService.saveSingle, échecs imprévus', () => {
  it('retourne le failure du verrou de définition', async () => {
    const cause = new Error('nature incohérente');

    const result = await toWriteServiceWithMocks({
      lockResult: failure('DATABASE_ERROR', cause),
    }).saveSingle({ data: toData() }, { user, tx });

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });

  it('convertit une exception du repository en DATABASE_ERROR', async () => {
    const cause = new Error('connexion perdue');

    const result = await toWriteServiceWithMocks({
      upsertUserValeur: vi.fn().mockRejectedValue(cause),
    }).saveSingle({ data: toData() }, { user, tx });

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });
});

describe('WriteIndicateurValeursService.saveBatch', () => {
  it('retourne le failure de la validation sans rien verrouiller ni écrire', async () => {
    const cause = new Error('refusé');
    const lock = vi.fn();
    const upsertWithoutMetadata = vi.fn();

    const result = await toWriteServiceWithMocks({
      validation: failure('UNAUTHORIZED', cause),
      lock,
      upsertWithoutMetadata,
    }).saveBatch(toPrepared(), { user, tx });

    expect(result).toEqual(failure('UNAUTHORIZED', cause));
    expect(lock).not.toHaveBeenCalled();
    expect(upsertWithoutMetadata).not.toHaveBeenCalled();
  });

  it('refuse un lot contenant une date non canonique sans rien écrire', async () => {
    const lock = vi.fn();
    const upsertWithoutMetadata = vi.fn();

    const result = await toWriteServiceWithMocks({
      lock,
      upsertWithoutMetadata,
    }).saveBatch(toPrepared([{}, { dateValeur: 'pas-une-date' }]), {
      user,
      tx,
    });

    expect(result).toMatchObject({ success: false, error: 'INVALID_VALUE' });
    expect(lock).not.toHaveBeenCalled();
    expect(upsertWithoutMetadata).not.toHaveBeenCalled();
  });

  it('convertit une exception d’écriture en DATABASE_ERROR', async () => {
    const cause = new Error('violation de contrainte');

    const result = await toWriteServiceWithMocks({
      upsertWithoutMetadata: vi.fn().mockRejectedValue(cause),
    }).saveBatch(toPrepared(), { user, tx });

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });

  it('retourne les valeurs écrites avec l’identifiant référentiel', async () => {
    const written = { id: 1, collectiviteId, indicateurId, resultat: 1 };

    const result = await toWriteServiceWithMocks({
      upsertWithoutMetadata: vi.fn().mockResolvedValue([written]),
    }).saveBatch(toPrepared(), { user, tx });

    expect(result).toEqual(success([written]));
  });
});

describe('WriteIndicateurValeursService.fillMissing', () => {
  it('retourne le failure de la lecture des valeurs existantes sans écrire', async () => {
    const cause = new Error('lecture impossible');
    const upsertWithoutMetadata = vi.fn();

    const result = await toWriteServiceWithMocks({
      listIndicateurValeurs: vi
        .fn()
        .mockResolvedValue(failure('DATABASE_ERROR', cause)),
      upsertWithoutMetadata,
    }).fillMissing(toPrepared(), { user, tx });

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
    expect(upsertWithoutMetadata).not.toHaveBeenCalled();
  });
});
