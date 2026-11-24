import { INestApplication } from '@nestjs/common';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { sql } from 'drizzle-orm';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
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
    const probeRows = await databaseService.db.execute<{ label: string }>(
      sql`select label from ${probeTable} order by label`
    );
    return probeRows.rows.map(({ label }) => label);
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sans transaction fournie', () => {
    it('valide les écritures quand l’opération réussit', async () => {
      const executionResult = await transactionManager.executeSingle(
        async (tx) => {
          await insertProbe(tx, 'écrit');
          return success('ok');
        }
      );

      expect(executionResult).toEqual({ success: true, data: 'ok' });
      expect(await listProbeLabels()).toEqual(['écrit']);
    });

    it('annule les écritures et retourne l’échec avec sa cause quand l’opération échoue', async () => {
      const cause = new Error('détail précis');

      const executionResult = await transactionManager.executeSingle(
        async (tx) => {
          await insertProbe(tx, 'annulé');
          return failure('UNAUTHORIZED', cause);
        }
      );

      expect(executionResult).toEqual({
        success: false,
        error: 'UNAUTHORIZED',
        cause,
      });
      expect(await listProbeLabels()).toEqual([]);
    });

    it('arrête les opérations suivantes au premier échec et annule tout', async () => {
      const executionResult = await transactionManager.executeTransaction([
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

      expect(executionResult).toEqual({
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

      const outerResult = await transactionManager.executeSingle(
        async (outerTx) => {
          const innerResult = await transactionManager.executeSingle(
            async () => failure('UNAUTHORIZED', cause),
            outerTx
          );
          return success(innerResult);
        }
      );

      expect(outerResult).toEqual({
        success: true,
        data: { success: false, error: 'UNAUTHORIZED', cause },
      });
    });

    it('passe à l’opération la transaction de l’appelant elle-même, pas une transaction imbriquée', async () => {
      const receivedTransactions: Transaction[] = [];

      await transactionManager.executeSingle(async (outerTx) => {
        receivedTransactions.push(outerTx);
        await transactionManager.executeSingle(async (tx) => {
          receivedTransactions.push(tx);
          return success(undefined);
        }, outerTx);
        return success(undefined);
      });

      const [outerTx, operationTx] = receivedTransactions;
      expect(operationTx).toBe(outerTx);
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
      const outerResult = await transactionManager.executeSingle(
        async (outerTx) => {
          const innerResult = await transactionManager.executeSingle(
            async (tx) => {
              await insertProbe(tx, 'opération réussie');
              return success('ok');
            },
            outerTx
          );
          return success(innerResult);
        }
      );

      expect(outerResult).toEqual({
        success: true,
        data: { success: true, data: 'ok' },
      });
      expect(await listProbeLabels()).toEqual(['opération réussie']);
    });

    it('annule aussi les écritures réussies quand l’appelant propage l’échec', async () => {
      const outerResult = await transactionManager.executeSingle(
        async (outerTx) => {
          await insertProbe(outerTx, 'appelant');
          const innerResult = await transactionManager.executeSingle(
            async (tx) => {
              await insertProbe(tx, 'opération réussie');
              return success('ok');
            },
            outerTx
          );
          if (!innerResult.success) return innerResult;
          return failure('UNAUTHORIZED');
        }
      );

      expect(outerResult).toEqual({
        success: false,
        error: 'UNAUTHORIZED',
        cause: undefined,
      });
      expect(await listProbeLabels()).toEqual([]);
    });

    it('annule la transaction de l’appelant sur une exception inattendue de l’opération', async () => {
      const unexpected = new Error('bug imprévu');

      const outerResult = await transactionManager.executeSingle(
        async (outerTx) => {
          await insertProbe(outerTx, 'appelant');
          const innerResult = await transactionManager.executeSingle(
            async (tx) => {
              await insertProbe(tx, 'opération');
              throw unexpected;
            },
            outerTx
          );
          return success(innerResult);
        }
      );

      expect(outerResult).toEqual({ success: false, error: unexpected });
      expect(await listProbeLabels()).toEqual([]);
    });

    it('relance l’erreur d’origine quand le nettoyage du savepoint échoue lui-même', async () => {
      const unexpected = new Error('bug imprévu');
      const cleanupFailure = new Error('connexion perdue');

      const outerResult = await transactionManager.executeSingle(
        async (outerTx) => {
          const innerResult = await transactionManager.executeSingle(
            async (tx) => {
              vi.spyOn(tx, 'execute').mockRejectedValueOnce(cleanupFailure);
              throw unexpected;
            },
            outerTx
          );
          return success(innerResult);
        }
      );

      expect(outerResult).toEqual({ success: false, error: unexpected });
    });

    it('rend la transaction utilisable après une erreur SQL interceptée par l’opération', async () => {
      const outerResult = await transactionManager.executeSingle(
        async (outerTx) => {
          const innerResult = await transactionManager.executeSingle(
            async (tx) => {
              try {
                await tx.execute(
                  sql`insert into ${probeTable} (label) values (null)`
                );
              } catch {
                return failure('DATABASE_ERROR');
              }
              return success(undefined);
            },
            outerTx
          );
          await insertProbe(outerTx, 'après l’erreur');
          return success(innerResult);
        }
      );

      expect(outerResult).toEqual({
        success: true,
        data: { success: false, error: 'DATABASE_ERROR', cause: undefined },
      });
      expect(await listProbeLabels()).toEqual(['après l’erreur']);
    });

    it('annule les écritures de toutes les opérations quand l’une d’elles échoue', async () => {
      let operationsResult: unknown;

      await transactionManager.executeSingle(async (outerTx) => {
        await insertProbe(outerTx, 'appelant');
        operationsResult = await transactionManager.executeTransaction(
          [
            async (tx) => {
              await insertProbe(tx, 'première');
              return success(1);
            },
            async () => failure('UNAUTHORIZED'),
          ],
          outerTx
        );
        return success(undefined);
      });

      expect(operationsResult).toEqual({
        success: false,
        error: 'UNAUTHORIZED',
        cause: undefined,
      });
      expect(await listProbeLabels()).toEqual(['appelant']);
    });

    it('annule l’opération intermédiaire quand l’opération imbriquée échoue et qu’elle propage l’échec', async () => {
      await transactionManager.executeSingle(async (outerTx) => {
        await insertProbe(outerTx, 'appelant');
        const intermediateResult = await transactionManager.executeSingle(
          async (intermediateTx) => {
            await insertProbe(intermediateTx, 'intermédiaire');
            const nestedResult = await transactionManager.executeSingle(
              async (tx) => {
                await insertProbe(tx, 'imbriquée');
                return failure('UNAUTHORIZED');
              },
              intermediateTx
            );
            if (!nestedResult.success) return nestedResult;
            return success(undefined);
          },
          outerTx
        );
        return success(intermediateResult);
      });

      expect(await listProbeLabels()).toEqual(['appelant']);
    });

    it('conserve l’opération intermédiaire quand elle ignore l’échec de l’opération imbriquée', async () => {
      await transactionManager.executeSingle(async (outerTx) => {
        await insertProbe(outerTx, 'appelant');
        const intermediateResult = await transactionManager.executeSingle(
          async (intermediateTx) => {
            await insertProbe(intermediateTx, 'intermédiaire');
            await transactionManager.executeSingle(async (tx) => {
              await insertProbe(tx, 'imbriquée');
              return failure('UNAUTHORIZED');
            }, intermediateTx);
            return success(undefined);
          },
          outerTx
        );
        return success(intermediateResult);
      });

      expect(await listProbeLabels()).toEqual(['appelant', 'intermédiaire']);
    });
  });

  describe('avec une transaction partagée sans annulation des écritures de l’opération', () => {
    it('retourne l’échec et conserve les écritures de l’opération dans la transaction de l’appelant', async () => {
      const outerResult = await transactionManager.executeSingle(
        async (outerTx) => {
          await insertProbe(outerTx, 'appelant');
          const innerResult = await transactionManager.executeSingle(
            async (tx) => {
              await insertProbe(tx, 'écriture conservée');
              return failure('UNAUTHORIZED');
            },
            outerTx,
            { undoWritesOnFailure: false }
          );
          return success(innerResult);
        }
      );

      expect(outerResult).toEqual({
        success: true,
        data: { success: false, error: 'UNAUTHORIZED', cause: undefined },
      });
      expect(await listProbeLabels()).toEqual([
        'appelant',
        'écriture conservée',
      ]);
    });

    it('laisse la transaction englobante tout annuler quand l’appelant propage l’échec', async () => {
      const outerResult = await transactionManager.executeSingle(
        async (outerTx) => {
          await insertProbe(outerTx, 'appelant');
          const innerResult = await transactionManager.executeSingle(
            async (tx) => {
              await insertProbe(tx, 'opération');
              return failure('UNAUTHORIZED');
            },
            outerTx,
            { undoWritesOnFailure: false }
          );
          return innerResult;
        }
      );

      expect(outerResult).toEqual({
        success: false,
        error: 'UNAUTHORIZED',
        cause: undefined,
      });
      expect(await listProbeLabels()).toEqual([]);
    });
  });
});
