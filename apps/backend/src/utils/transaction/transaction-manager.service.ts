import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { type Name, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

export type TransactionOperation<T, E = string> = (
  tx: Transaction
) => Promise<Result<T, E>>;

export type TransactionExecutionOptions = { undoWritesOnFailure?: boolean };

@Injectable()
export class TransactionManager {
  private readonly logger = new Logger(TransactionManager.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Execute operations in a transaction with automatic rollback on error.
   *
   * @param operations Array of operations to execute in order
   * @param tx Transaction (created if not provided)
   * @returns Result of all operations
   */
  async executeTransaction<T, E = string>(
    operations: TransactionOperation<T, E>[],
    tx?: Transaction,
    options: TransactionExecutionOptions = {}
  ): Promise<Result<T[], E>> {
    try {
      const runOperations = async (transaction: Transaction) => {
        const results: T[] = [];
        for (const operation of operations) {
          const result = await operation(transaction);
          if (!result.success) {
            // throw le Result complet pour préserver error + cause au rollback
            throw result;
          }
          results.push(result.data);
        }
        return results;
      };

      if (tx) {
        const { undoWritesOnFailure = true } = options;
        return success(
          undoWritesOnFailure
            ? await this.runInSavepoint(tx, runOperations)
            : await runOperations(tx)
        );
      }

      const results = await this.databaseService.db.transaction(runOperations);
      return success(results);
    } catch (error) {
      // Un Result en échec est une issue prévue (droits refusés, ressource
      // absente, garde non satisfaite) : il annule la transaction sans être un
      // incident. Seule une exception non maîtrisée mérite le niveau error.
      if (isFailedResult<E>(error)) {
        this.logger.debug(`Transaction rolled back: ${String(error.error)}`);
        return failure(error.error, error.cause);
      }
      this.logger.error('Transaction failed:', error);
      // en cas de transaction partagée, relancer l'erreur pour que Drizzle fasse le rollback
      // (l'objet tx de Drizzle n'expose pas de méthode rollback())
      if (tx) {
        throw error;
      }
      return failure(error as E);
    }
  }

  private async runInSavepoint<T>(
    tx: Transaction,
    run: (transaction: Transaction) => Promise<T>
  ): Promise<T> {
    const savepoint = sql.identifier(
      `tet_savepoint_${randomUUID().replaceAll('-', '')}`
    );
    await tx.execute(sql`savepoint ${savepoint}`);
    try {
      const result = await run(tx);
      await tx.execute(sql`release savepoint ${savepoint}`);
      return result;
    } catch (error) {
      await this.undoSavepoint(tx, savepoint);
      throw error;
    }
  }

  private async undoSavepoint(tx: Transaction, savepoint: Name): Promise<void> {
    try {
      await tx.execute(sql`rollback to savepoint ${savepoint}`);
      await tx.execute(sql`release savepoint ${savepoint}`);
    } catch (cleanupError) {
      this.logger.error('Savepoint cleanup failed:', cleanupError);
    }
  }

  /**
   * Execute a single operation in a transaction.
   * Si `tx` est fourni, utilise cette transaction (partage entre services).
   *
   * @param operation Operation to execute
   * @param tx Transaction (created if not provided)
   * @returns Result of the operation
   */
  async executeSingle<T, E = string>(
    operation: TransactionOperation<T, E>,
    tx?: Transaction,
    options: TransactionExecutionOptions = {}
  ): Promise<Result<T, E>> {
    const result = await this.executeTransaction([operation], tx, options);
    if (!result.success) {
      return failure(result.error, result.cause);
    }
    return success(result.data[0]);
  }
}

export function isFailedResult<E>(
  error: unknown
): error is Extract<Result<unknown, E>, { success: false }> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'success' in error &&
    (error as Result<unknown, E>).success === false
  );
}
