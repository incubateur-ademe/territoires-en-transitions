import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';

export type TransactionOperation<T, E = string> = (
  tx: Transaction
) => Promise<Result<T, E>>;

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
    tx?: Transaction
  ): Promise<Result<T[], E>> {
    try {
      const runOperations = async (transaction: Transaction) => {
        const results: T[] = [];
        for (const operation of operations) {
          const result = await operation(transaction);
          if (!result.success) {
            // throw pour provoquer le rollback, sera capturé dans le catch
            throw result.error;
          }
          results.push(result.data);
        }
        return results;
      };

      if (tx) {
        return success(await runOperations(tx));
      }

      const results = await this.databaseService.db.transaction(runOperations);
      return success(results);
    } catch (error) {
      this.logger.error('Transaction failed:', error);
      // en cas de transaction partagée, déclenche le rollback explicitement
      // (le manager intercepte le throw, donc Drizzle ne le fait pas automatiquement)
      if (tx) {
        await tx.rollback();
      }
      return failure(error as E);
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
    tx?: Transaction
  ): Promise<Result<T, E>> {
    const result = await this.executeTransaction([operation], tx);
    if (!result.success) {
      return failure(result.error);
    }
    return success(result.data[0]);
  }
}
