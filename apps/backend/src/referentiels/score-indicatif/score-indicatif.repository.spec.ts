import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
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
});
