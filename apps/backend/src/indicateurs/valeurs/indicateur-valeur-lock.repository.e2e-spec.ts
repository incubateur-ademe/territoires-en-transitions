import { INestApplication } from '@nestjs/common';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { IndicateurValeurLockRepository } from './indicateur-valeur-lock.repository';

describe('IndicateurValeurLockRepository', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let lockRepository: IndicateurValeurLockRepository;

  const listTableLockModes = async (tx: Transaction): Promise<string[]> => {
    const heldLocks = await tx.execute<{ mode: string }>(sql`
      select mode
      from pg_locks
      where pid = pg_backend_pid()
        and locktype = 'relation'
        and relation = 'indicateur_valeur'::regclass
        and mode = 'ShareRowExclusiveLock'
        and granted
    `);
    return heldLocks.rows.map(({ mode }) => mode);
  };

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);
    lockRepository = app.get(IndicateurValeurLockRepository);
  });

  afterAll(async () => {
    await app.close();
  });

  it('ne tient qu’un seul verrou de table même quand lockAllPeriodes est appelé deux fois', async () => {
    await databaseService.db.transaction(async (tx) => {
      await lockRepository.lockAllPeriodes(tx);
      await lockRepository.lockAllPeriodes(tx);

      expect(await listTableLockModes(tx)).toEqual(['ShareRowExclusiveLock']);
    });
  });

  it('ne pose aucun verrou par période tant que le verrou de table est tenu', async () => {
    await databaseService.db.transaction(async (tx) => {
      await lockRepository.lockAllPeriodes(tx);

      await lockRepository.lock(
        [{ collectiviteId: 1, dateValeur: '2025-01-01' }],
        tx
      );

      const advisoryLocks = await tx.execute<{ locktype: string }>(sql`
        select locktype
        from pg_locks
        where pid = pg_backend_pid() and locktype = 'advisory'
      `);
      expect(advisoryLocks.rows).toEqual([]);
    });
  });

  it('reprend le verrou de table après l’annulation du savepoint qui l’avait posé', async () => {
    await databaseService.db.transaction(async (tx) => {
      await tx.execute(sql`savepoint verrou_de_table`);
      await lockRepository.lockAllPeriodes(tx);
      await tx.execute(sql`rollback to savepoint verrou_de_table`);
      expect(await listTableLockModes(tx)).toEqual([]);

      await lockRepository.lock(
        [{ collectiviteId: 1, dateValeur: '2025-01-01' }],
        tx
      );

      expect(await listTableLockModes(tx)).toEqual(['ShareRowExclusiveLock']);
    });
  });
});
