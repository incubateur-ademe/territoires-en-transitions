import { describe, expect, it } from 'vitest';
import { describeClassifyBatchFailure } from './describe-classify-batch-failure.rules';

describe('describeClassifyBatchFailure', () => {
  it("donne le statut HTTP d'une erreur d'API", () => {
    expect(
      describeClassifyBatchFailure({ kind: 'api_error', httpStatus: 400 })
    ).toBe('api_error 400');
  });

  it('donne la règle violée par un JSON invalide', () => {
    expect(
      describeClassifyBatchFailure({
        kind: 'invalid_json',
        rawTextLength: 120,
        schemaIssue: { path: ['fiches', 3, 'volets'], code: 'invalid_type' },
      })
    ).toBe('invalid_json (fiches.3.volets : invalid_type)');
  });

  it('donne les index manquants dans la réponse', () => {
    expect(
      describeClassifyBatchFailure({ kind: 'missing_indexes', indexes: [2, 7] })
    ).toBe('missing_indexes (2, 7)');
  });

  it("donne l'index d'une abstention contradictoire", () => {
    expect(
      describeClassifyBatchFailure({
        kind: 'contradictory_abstention',
        index: 4,
      })
    ).toBe('contradictory_abstention (index 4)');
  });

  it("donne l'enjeu inconnu", () => {
    expect(
      describeClassifyBatchFailure({ kind: 'unknown_enjeu', enjeu: 'eau' })
    ).toBe('unknown_enjeu (eau)');
  });
});
