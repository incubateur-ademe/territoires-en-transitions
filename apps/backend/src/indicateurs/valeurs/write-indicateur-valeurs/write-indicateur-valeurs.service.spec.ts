import { buildRequesterUser } from '@tet/backend/users/models/auth.models';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { success } from '@tet/backend/utils/result.type';
import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import { IndicateurLockRepository } from '../../indicateur/indicateur-lock.repository';
import { IndicateurValeurLockRepository } from '../indicateur-valeur-lock.repository';
import { IndicateurValeursRepository } from '../indicateur-valeurs.repository';
import { UpsertValeurIndicateur } from './upsert-valeur-indicateur.request';
import { ValidateIndicateurValeursWriteService } from './validate-indicateur-valeurs-write.service';
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
  existing = null,
  stored = null,
}: {
  lockedIndicateurs?: unknown[];
  existing?: unknown;
  stored?: unknown;
}) => {
  const repository = {
    findUserValeur: vi.fn().mockResolvedValue(existing),
    updateUserValeur: vi.fn().mockResolvedValue(stored),
    upsertUserValeur: vi.fn().mockResolvedValue(stored),
  } as unknown as IndicateurValeursRepository;
  const indicateurLockRepository = {
    lockIndicateurs: vi.fn().mockResolvedValue(success(lockedIndicateurs)),
  } as unknown as IndicateurLockRepository;
  const lockRepository = {
    lock: vi.fn().mockResolvedValue(undefined),
  } as unknown as IndicateurValeurLockRepository;
  return new WriteIndicateurValeursService(
    repository,
    {} as ValidateIndicateurValeursWriteService,
    indicateurLockRepository,
    lockRepository
  );
};

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
