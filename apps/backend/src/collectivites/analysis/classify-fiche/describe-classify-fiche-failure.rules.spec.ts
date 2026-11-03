import { describe, expect, it } from 'vitest';
import { describeClassifyFicheFailure } from './describe-classify-fiche-failure.rules';

describe('describeClassifyFicheFailure', () => {
  it("donne le statut HTTP d'une erreur d'API", () => {
    expect(
      describeClassifyFicheFailure({ kind: 'api_error', httpStatus: 400 })
    ).toBe('api_error 400');
  });

  it('donne la règle violée par un JSON invalide', () => {
    expect(
      describeClassifyFicheFailure({
        kind: 'invalid_json',
        rawTextLength: 120,
        schemaIssue: { path: ['leviers', 0, 'levier'], code: 'invalid_value' },
      })
    ).toBe('invalid_json (leviers.0.levier : invalid_value)');
  });

  it("donne l'enjeu inconnu", () => {
    expect(
      describeClassifyFicheFailure({ kind: 'unknown_enjeu', enjeu: 'eau' })
    ).toBe('unknown_enjeu (eau)');
  });
});
