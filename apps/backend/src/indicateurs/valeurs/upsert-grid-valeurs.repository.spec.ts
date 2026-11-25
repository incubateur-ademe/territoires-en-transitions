import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import {
  IndicateurPeriodiciteEnum,
  IndicateurValeurCreate,
} from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import { UpsertGridValeursRepository } from './upsert-grid-valeurs.repository';

const toValeur = (
  overrides: Partial<IndicateurValeurCreate>
): IndicateurValeurCreate =>
  ({
    collectiviteId: 3,
    indicateurId: 10,
    dateValeur: '2026-01-01',
    periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
    metadonneeId: null,
    ...overrides,
  } as IndicateurValeurCreate);

const toTransactionReturning = (batches: unknown[][]) => {
  const returning = vi.fn();
  batches.forEach((batch) => returning.mockResolvedValueOnce(batch));
  const insert = vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      onConflictDoUpdate: vi.fn().mockReturnValue({ returning }),
    }),
  });
  return { transaction: { insert } as unknown as Transaction, insert };
};

describe('UpsertGridValeursRepository.upsert', () => {
  it('retourne les valeurs écrites de tous les lots', async () => {
    const withBoth = toValeur({ resultat: 1, objectif: 2 });
    const withResultat = toValeur({ indicateurId: 11, resultat: 3 });
    const { transaction } = toTransactionReturning([
      [withBoth],
      [withResultat],
    ]);

    const result = await new UpsertGridValeursRepository().upsert(
      [withBoth, withResultat],
      transaction
    );

    expect(result).toEqual(success([withBoth, withResultat]));
  });

  it('retourne un échec DATABASE_ERROR quand un lot écrit moins de lignes que demandé, sans écrire les lots suivants', async () => {
    const withBoth = toValeur({ resultat: 1, objectif: 2 });
    const withResultat = toValeur({ indicateurId: 11, resultat: 3 });
    const { transaction, insert } = toTransactionReturning([[withBoth], []]);

    const result = await new UpsertGridValeursRepository().upsert(
      [withBoth, withResultat, toValeur({ indicateurId: 12, objectif: 4 })],
      transaction
    );

    expect(result).toEqual(
      failure(
        'DATABASE_ERROR',
        new Error("Échec de l'écriture d'un lot de 1 valeurs d'indicateur")
      )
    );
    expect(insert).toHaveBeenCalledTimes(2);
  });
});
