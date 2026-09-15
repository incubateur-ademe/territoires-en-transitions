import { BadRequestException } from '@nestjs/common';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  captureIndicateurValeursResult,
  getIndicateurValeursDataOrThrow,
} from './indicateur-valeurs.errors';

describe('indicateur valeurs transaction errors', () => {
  it('preserves the typed failure and cause rethrown by a shared transaction', async () => {
    const cause = new BadRequestException('Périodicité incompatible');
    const expected = failure('INVALID_VALUE' as const, cause);
    const manager = new TransactionManager({} as never);
    const result = await captureIndicateurValeursResult(() =>
      manager.executeSingle(async () => expected, {} as Transaction)
    );

    expect(result).toEqual(expected);
    expect(() => getIndicateurValeursDataOrThrow(result)).toThrow(cause);
  });

  it('preserves an unexpected error returned by the transaction manager', async () => {
    const cause = new Error('Calculation failed');
    const manager = new TransactionManager({
      db: {
        transaction: async () => {
          throw cause;
        },
      },
    } as never);
    const result = await captureIndicateurValeursResult(async () =>
      getIndicateurValeursDataOrThrow(
        await manager.executeSingle(async () =>
          failure('DATABASE_ERROR' as const)
        )
      )
    );

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
    expect(() => getIndicateurValeursDataOrThrow(result)).toThrow(cause);
  });
});
