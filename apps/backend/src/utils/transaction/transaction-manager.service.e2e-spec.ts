import { INestApplication } from '@nestjs/common';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TransactionManager } from './transaction-manager.service';

const probeTable = sql.identifier(
  `transaction_manager_probe_${process.pid}_${Date.now()}`
);

describe('TransactionManager', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let transactionManager: TransactionManager;

  const insertProbe = (tx: Transaction, label: string) =>
    tx.execute(sql`insert into ${probeTable} (label) values (${label})`);

  const listProbeLabels = async (): Promise<string[]> => {
    const result = await databaseService.db.execute<{ label: string }>(
      sql`select label from ${probeTable} order by label`
    );
    return result.rows.map(({ label }) => label);
  };

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);
    transactionManager = app.get(TransactionManager);
    await databaseService.db.execute(
      sql`create table ${probeTable} (label text not null)`
    );
  });

  afterAll(async () => {
    await databaseService.db.execute(sql`drop table ${probeTable}`);
    await app.close();
  });

  beforeEach(async () => {
    await databaseService.db.execute(sql`delete from ${probeTable}`);
  });

  describe('sans transaction fournie', () => {
    it('valide les écritures quand l’opération réussit', async () => {
      const result = await transactionManager.executeSingle(async (tx) => {
        await insertProbe(tx, 'écrit');
        return success('ok');
      });

      expect(result).toEqual({ success: true, data: 'ok' });
      expect(await listProbeLabels()).toEqual(['écrit']);
    });

    it('annule les écritures et retourne l’échec avec sa cause quand l’opération échoue', async () => {
      const cause = new Error('détail précis');

      const result = await transactionManager.executeSingle(async (tx) => {
        await insertProbe(tx, 'annulé');
        return failure('UNAUTHORIZED', cause);
      });

      expect(result).toEqual({ success: false, error: 'UNAUTHORIZED', cause });
      expect(await listProbeLabels()).toEqual([]);
    });

    it('arrête les opérations suivantes au premier échec et annule tout', async () => {
      const result = await transactionManager.executeTransaction([
        async (tx) => {
          await insertProbe(tx, 'première');
          return success(1);
        },
        async () => failure('UNAUTHORIZED'),
        async (tx) => {
          await insertProbe(tx, 'troisième');
          return success(3);
        },
      ]);

      expect(result).toEqual({
        success: false,
        error: 'UNAUTHORIZED',
        cause: undefined,
      });
      expect(await listProbeLabels()).toEqual([]);
    });
  });

  describe('avec une transaction partagée', () => {
    it('retourne l’échec au lieu de le lancer, avec sa cause', async () => {
      const cause = new Error('détail précis');

      const outcome = await transactionManager.executeSingle(async (outerTx) => {
        const inner = await transactionManager.executeSingle(
          async () => failure('UNAUTHORIZED', cause),
          outerTx
        );
        return success(inner);
      });

      expect(outcome).toEqual({
        success: true,
        data: { success: false, error: 'UNAUTHORIZED', cause },
      });
    });

    it('annule les écritures de l’opération en échec et conserve celles de l’appelant', async () => {
      await transactionManager.executeSingle(async (outerTx) => {
        await insertProbe(outerTx, 'appelant');
        await transactionManager.executeSingle(async (tx) => {
          await insertProbe(tx, 'opération en échec');
          return failure('UNAUTHORIZED');
        }, outerTx);
        return success(undefined);
      });

      expect(await listProbeLabels()).toEqual(['appelant']);
    });

    it('conserve les écritures d’une opération réussie dans la transaction de l’appelant', async () => {
      const outcome = await transactionManager.executeSingle(async (outerTx) => {
        const inner = await transactionManager.executeSingle(async (tx) => {
          await insertProbe(tx, 'opération réussie');
          return success('ok');
        }, outerTx);
        return success(inner);
      });

      expect(outcome).toEqual({
        success: true,
        data: { success: true, data: 'ok' },
      });
      expect(await listProbeLabels()).toEqual(['opération réussie']);
    });

    it('annule aussi les écritures réussies quand l’appelant propage l’échec', async () => {
      const outcome = await transactionManager.executeSingle(async (outerTx) => {
        await insertProbe(outerTx, 'appelant');
        const inner = await transactionManager.executeSingle(async (tx) => {
          await insertProbe(tx, 'opération réussie');
          return success('ok');
        }, outerTx);
        if (!inner.success) return inner;
        return failure('UNAUTHORIZED');
      });

      expect(outcome).toEqual({
        success: false,
        error: 'UNAUTHORIZED',
        cause: undefined,
      });
      expect(await listProbeLabels()).toEqual([]);
    });

    it('annule la transaction de l’appelant sur une exception inattendue de l’opération', async () => {
      const unexpected = new Error('bug imprévu');

      const outcome = transactionManager.executeSingle(async (outerTx) => {
        const inner = await transactionManager.executeSingle(async () => {
          throw unexpected;
        }, outerTx);
        return success(inner);
      });

      await expect(outcome).resolves.toEqual({
        success: false,
        error: unexpected,
      });
    });
  });
});
