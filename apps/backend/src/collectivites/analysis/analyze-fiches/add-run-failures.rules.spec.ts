import { describe, expect, it } from 'vitest';
import { RunFailure, addRunFailures } from './add-run-failures.rules';

const toFicheFailures = (ficheIds: number[]): RunFailure[] =>
  ficheIds.map((ficheId) => ({ kind: 'fiche', ficheId }));

describe('llm-issue', () => {
  it.skip('laisse le passage continuer à 9 fiches en échec définitif', () => {
    const failuresResult = addRunFailures(
      [],
      toFicheFailures([1, 2, 3, 4, 5, 6, 7, 8, 9])
    );

    expect(failuresResult).toEqual({
      success: true,
      data: toFicheFailures([1, 2, 3, 4, 5, 6, 7, 8, 9]),
    });
  });

  it.skip('abandonne le passage à la 10e fiche en échec définitif, en rapportant toutes les fiches', () => {
    const failuresResult = addRunFailures(
      toFicheFailures([1, 2, 3, 4, 5, 6, 7, 8, 9]),
      toFicheFailures([10])
    );

    expect(failuresResult).toEqual({
      success: false,
      error: {
        kind: 'failure_threshold_reached',
        failures: toFicheFailures([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      },
    });
  });

  it.skip('abandonne quand un seul lot fait passer le compte de 8 à 12', () => {
    const failuresResult = addRunFailures(
      toFicheFailures([1, 2, 3, 4, 5, 6, 7, 8]),
      toFicheFailures([9, 10, 11, 12])
    );

    expect(failuresResult).toEqual({
      success: false,
      error: {
        kind: 'failure_threshold_reached',
        failures: toFicheFailures([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
      },
    });
  });

  it.skip('additionne fiches et CT en échec dans le même seuil', () => {
    const failuresResult = addRunFailures(
      [],
      [
        ...toFicheFailures([1, 2, 3, 4, 5, 6, 7]),
        { kind: 'mobilisation', collectiviteId: 10 },
        { kind: 'mobilisation', collectiviteId: 11 },
        { kind: 'mobilisation', collectiviteId: 12 },
      ]
    );

    expect(failuresResult).toEqual({
      success: false,
      error: {
        kind: 'failure_threshold_reached',
        failures: [
          ...toFicheFailures([1, 2, 3, 4, 5, 6, 7]),
          { kind: 'mobilisation', collectiviteId: 10 },
          { kind: 'mobilisation', collectiviteId: 11 },
          { kind: 'mobilisation', collectiviteId: 12 },
        ],
      },
    });
  });
});

describe('invariants', () => {
  it.skip('un passage sans échec continue', () => {
    const failuresResult = addRunFailures([], []);

    expect(failuresResult).toEqual({ success: true, data: [] });
  });
});
