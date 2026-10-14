import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it } from 'vitest';
import { keepSucceededBatches } from './keep-succeeded-batches';

const describeBatch = (batch: string[]) => `Lot de ${batch.length}`;

describe('keepSucceededBatches', () => {
  it('garde les lots réussis et compte ceux en échec, avec un avertissement chacun', () => {
    const result = keepSucceededBatches(
      [['a'], ['b', 'c'], ['d']],
      [
        success(1),
        failure({ kind: 'api_error', httpStatus: 503 }),
        failure({ kind: 'rate_limited' }),
      ],
      describeBatch
    );

    expect(result).toEqual({
      success: true,
      data: {
        outcomes: [1],
        warnings: ['Lot de 2 : api_error 503', 'Lot de 1 : rate_limited'],
        failedBatches: 2,
      },
    });
  });

  it("n'échoue pas quand tous les lots échouent pour une autre raison que le quota", () => {
    const result = keepSucceededBatches(
      [['a'], ['b']],
      [failure({ kind: 'truncated' }), failure({ kind: 'rate_limited' })],
      describeBatch
    );

    expect(result).toMatchObject({
      success: true,
      data: { outcomes: [], failedBatches: 2 },
    });
  });

  it('échoue quand tous les lots butent sur le quota', () => {
    const result = keepSucceededBatches(
      [['a'], ['b']],
      [failure({ kind: 'rate_limited' }), failure({ kind: 'rate_limited' })],
      describeBatch
    );

    expect(result).toEqual({
      success: false,
      error: { kind: 'rate_limited' },
    });
  });

  it('réussit sans lot', () => {
    expect(keepSucceededBatches([], [], describeBatch)).toEqual({
      success: true,
      data: { outcomes: [], warnings: [], failedBatches: 0 },
    });
  });
});
