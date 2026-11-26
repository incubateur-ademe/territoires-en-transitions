import { describeEstimationError, type SolveError } from 'ademe-planet';
import { describe, expect, test } from 'vitest';
import { toLevierGesFailure } from './levier-ges.errors';

describe('toLevierGesFailure', () => {
  const readableErrors: SolveError[] = [
    {
      kind: 'invalid_request',
      issues: [
        {
          parameter: 'parameters.x',
          code: 'not_a_decimal',
          message: 'must be a decimal number',
        },
        {
          parameter: 'parameters.y',
          code: 'required',
          message: 'Required',
        },
      ],
    },
    { kind: 'unknown_territory', level: 'epci', code: '1' },
    { kind: 'level_not_computed', lever: 'haies', level: 'epci' },
    { kind: 'missing_data', dataset: 'd', key: 'k' },
    {
      kind: 'unreachable_target',
      solveFor: 'hedgeKmCreatedPerYear',
      minReduction: '0',
      maxReduction: '100',
    },
    { kind: 'non_monotonic_parameter', solveFor: 'hedgeKmCreatedPerYear' },
  ];

  test.each(readableErrors)(
    '$kind : le kind du paquet sert de code et le message du paquet de cause',
    (error) => {
      expect(toLevierGesFailure(error)).toEqual({
        success: false,
        error: error.kind,
        cause: new Error(describeEstimationError(error)),
      });
    }
  );

  test('invalid_dataset : aucune cause, donc aucune fuite du détail', () => {
    expect(
      toLevierGesFailure({
        kind: 'invalid_dataset',
        dataset: 'secret-dataset',
        reason: 'unreadable',
        detail: 'ENOENT /app/data',
      })
    ).toEqual({
      success: false,
      error: 'invalid_dataset',
      cause: undefined,
    });
  });
});
