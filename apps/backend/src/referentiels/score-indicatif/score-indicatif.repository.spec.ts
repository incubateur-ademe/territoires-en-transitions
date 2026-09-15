import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import { ScoreIndicatifRepository } from './score-indicatif.repository';

describe('ScoreIndicatifRepository', () => {
  const firstScope = {
    actionId: 'cae_1.2.3',
    collectiviteId: 42,
    indicateurId: 7,
  } as const;

  it('acquires one transaction-scoped advisory lock for the complete scope', async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const repository = new ScoreIndicatifRepository({} as DatabaseService);
    const tx = { execute } as unknown as Transaction;

    await repository.lockSelectionScope(firstScope, tx);

    expect(execute).toHaveBeenCalledOnce();
    const query = execute.mock.calls[0]?.[0] as SQL;
    expect(new PgDialect().sqlToQuery(query).params).toEqual([
      'score-indicatif-selection:cae_1.2.3:42:7',
    ]);
  });
  it('restricts selected IDs to annual values in the requested collectivité and definition', async () => {
    const query = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    const tx = {
      select: vi.fn().mockReturnValue(query),
    } as unknown as Transaction;
    const repository = new ScoreIndicatifRepository({} as DatabaseService);
    await repository.listCompatibleValeurIds(firstScope, [101, 102], tx);
    const condition = new PgDialect().sqlToQuery(
      query.where.mock.calls[0][0] as SQL
    );
    expect(condition.sql).toContain('"indicateur_valeur"."periodicite" =');
    expect(condition.sql).toContain('"indicateur_valeur"."indicateur_id" =');
    expect(condition.sql).toContain('"indicateur_valeur"."collectivite_id" =');
    expect(condition.params).toEqual([
      101,
      102,
      IndicateurPeriodiciteEnum.ANNUELLE,
      firstScope.indicateurId,
      firstScope.collectiviteId,
    ]);
  });

  describe('getValeursUtiliseesParActionId', () => {
    it('maps result/program values and preserves zero', async () => {
      const query = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          {
            actionId: 'cae_1.2.3.3.4',
            indicateurValeurId: 101,
            typeScore: 'fait',
            indicateurId: 7,
            dateValeur: '2025-01-01',
            resultat: 0,
            objectif: 12,
            sourceLibelle: 'CITEPA',
            sourceMetadonnee: null,
          },
          {
            actionId: 'cae_1.2.3.3.4',
            indicateurValeurId: 102,
            typeScore: 'programme',
            indicateurId: 7,
            dateValeur: '2026-01-01',
            resultat: 34,
            objectif: 0,
            sourceLibelle: null,
            sourceMetadonnee: null,
          },
          {
            actionId: 'cae_1.2.3.3.4',
            indicateurValeurId: 103,
            typeScore: 'fait',
            indicateurId: 7,
            dateValeur: '2027-01-01',
            resultat: null,
            objectif: 99,
            sourceLibelle: null,
            sourceMetadonnee: null,
          },
        ]),
      };
      const repository = new ScoreIndicatifRepository({
        db: { select: vi.fn().mockReturnValue(query) },
      } as unknown as DatabaseService);
      await expect(
        repository.listValeursUtiliseesParActionId({
          actionIds: ['cae_1.2.3.3.4'],
          collectiviteId: 42,
        })
      ).resolves.toEqual({
        success: true,
        data: {
          ['cae_1.2.3.3.4']: [
            expect.objectContaining({ indicateurValeurId: 101, valeur: 0 }),
            expect.objectContaining({ indicateurValeurId: 102, valeur: 0 }),
          ],
        },
      });
      const condition = new PgDialect().sqlToQuery(
        query.where.mock.calls[0][0] as SQL
      );
      expect(condition.sql).toContain('"indicateur_valeur"."periodicite" =');
      expect(condition.params).toContain(IndicateurPeriodiciteEnum.ANNUELLE);
    });
  });
});
