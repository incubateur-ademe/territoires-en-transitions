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
   * Execute operations in a transaction with automatic rollback on error
   * @param operations Array of operations to execute in order
   * @returns Result of all operations
   */
  async executeTransaction<T, E = string>(
    operations: TransactionOperation<T, E>[]
  ): Promise<Result<T[], E>> {
    try {
      const results: T[] = [];

      await this.databaseService.db.transaction(async (tx) => {
        for (const operation of operations) {
          const result = await operation(tx);
          if (!result.success) {
            // Throw to trigger rollback, will be caught in outer catch
            throw result.error;
          }
          results.push(result.data);
        }
      });

      return success(results);
    } catch (error) {
      this.logger.error('Transaction failed:', error);
      return failure(error as E);
    }
  }

  /**
   * Execute a single operation in a transaction
   * @param operation Operation to execute
   * @returns Result of the operation
   */
  async executeSingle<T, E = string>(
    operation: TransactionOperation<T, E>
  ): Promise<Result<T, E>> {
    const result = await this.executeTransaction([operation]);
    if (!result.success) {
      return failure(result.error);
    }
    return success(result.data[0]);
  }
}
