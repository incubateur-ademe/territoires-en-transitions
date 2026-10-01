import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it, vi } from 'vitest';
import { IndicateurValeurLockRepository } from './indicateur-valeur-lock.repository';

describe('IndicateurValeurLockRepository', () => {
  it('déduplique et ordonne les verrous de période', async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const repository = new IndicateurValeurLockRepository();

    await repository.lock(
      [
        { collectiviteId: 2, dateValeur: '2026-02-01' },
        { collectiviteId: 1, dateValeur: '2026-02-01' },
        { collectiviteId: 1, dateValeur: '2026-01-01' },
        { collectiviteId: 1, dateValeur: '2026-02-01' },
      ],
      { execute } as never
    );

    const query = execute.mock.calls[0]?.[0] as SQL;
    expect(new PgDialect().sqlToQuery(query).params).toEqual([
      'indicateur-valeur:1:2026-01-01',
      'indicateur-valeur:1:2026-02-01',
      'indicateur-valeur:2:2026-02-01',
    ]);
  });

  it('acquiert tous les verrous en une requête', async () => {
    const execute = vi.fn();
    const repository = new IndicateurValeurLockRepository();

    await repository.lock(
      [
        { collectiviteId: 1, dateValeur: '2026-01-01' },
        { collectiviteId: 1, dateValeur: '2026-02-01' },
      ],
      { execute } as never
    );

    expect(execute).toHaveBeenCalledOnce();
  });
});
