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

  it("n'échoue pas quand un lot échoue sur une erreur qu'une reprise ne corrigerait pas", () => {
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

  it('échoue quand tous les lots échouent sur une panne ou une coupure, mêlées au quota', () => {
    const result = keepSucceededBatches(
      [['a'], ['b'], ['c']],
      [
        failure({ kind: 'api_error', httpStatus: 500 }),
        failure({ kind: 'rate_limited' }),
        failure({ kind: 'api_error', httpStatus: null }),
      ],
      describeBatch
    );

    expect(result).toEqual({
      success: false,
      error: { kind: 'api_error', httpStatus: 500 },
    });
  });

  it('réussit sans lot', () => {
    expect(keepSucceededBatches([], [], describeBatch)).toEqual({
      success: true,
      data: { outcomes: [], warnings: [], failedBatches: 0 },
    });
  });
});
