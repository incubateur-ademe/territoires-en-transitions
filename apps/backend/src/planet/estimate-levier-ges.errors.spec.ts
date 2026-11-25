import { describe, expect, test } from 'vitest';
import { toEstimateLevierGesFailure } from './estimate-levier-ges.errors';

describe('toEstimateLevierGesFailure', () => {
  test('invalid_request : la cause liste les paramètres fautifs', () => {
    expect(
      toEstimateLevierGesFailure({
        kind: 'invalid_request',
        issues: [
          { parameter: 'parameters.x', message: 'must be a decimal number' },
          { parameter: 'parameters.y', message: 'Invalid input' },
        ],
      })
    ).toEqual({
      success: false,
      error: 'invalid_request',
      cause: new Error(
        'Requête invalide : parameters.x (must be a decimal number), parameters.y (Invalid input)'
      ),
    });
  });

  test('unknown_territory : la cause nomme le territoire', () => {
    expect(
      toEstimateLevierGesFailure({
        kind: 'unknown_territory',
        level: 'epci',
        code: '1',
      })
    ).toEqual({
      success: false,
      error: 'unknown_territory',
      cause: new Error('Territoire inconnu (epci 1)'),
    });
  });

  test('level_not_computed : la cause nomme le levier et le niveau', () => {
    expect(
      toEstimateLevierGesFailure({
        kind: 'level_not_computed',
        lever: 'haies',
        level: 'epci',
      })
    ).toEqual({
      success: false,
      error: 'level_not_computed',
      cause: new Error("Le levier haies n'est pas calculé au niveau epci"),
    });
  });

  test('missing_data : la cause nomme le jeu de données et la clé', () => {
    expect(
      toEstimateLevierGesFailure({
        kind: 'missing_data',
        dataset: 'd',
        key: 'k',
      })
    ).toEqual({
      success: false,
      error: 'missing_data',
      cause: new Error('Données manquantes pour ce territoire (d, k)'),
    });
  });

  test('invalid_dataset : aucune cause, donc aucune fuite du détail', () => {
    const failure = toEstimateLevierGesFailure({
      kind: 'invalid_dataset',
      dataset: 'secret-dataset',
      reason: 'unreadable',
      detail: 'ENOENT /app/data',
    });

    expect(failure).toEqual({
      success: false,
      error: 'invalid_dataset',
      cause: undefined,
    });
  });
});
