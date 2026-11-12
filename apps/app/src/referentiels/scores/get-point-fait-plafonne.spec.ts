import { describe, expect, it } from 'vitest';
import { getPointFaitPlafonne } from './get-point-fait-plafonne';

describe('getPointFaitPlafonne', () => {
  it('renvoie les points retirés par le plafond (cas CAE 3.3.5)', () => {
    // 3.3.5 : 1,42 pt fait ramené à 0,88 (44 % comme la 1.2.3)
    expect(
      getPointFaitPlafonne({
        pointPotentiel: 2,
        pointFait: 0.88,
        pointProgramme: 0,
        pointPasFait: 0.58,
        pointNonRenseigne: 0,
      })
    ).toBeCloseTo(0.54);
  });

  it("ignore l'écart dû aux arrondis", () => {
    expect(
      getPointFaitPlafonne({
        pointPotentiel: 1,
        pointFait: 0.333,
        pointProgramme: 0.333,
        pointPasFait: 0.333,
        pointNonRenseigne: 0,
      })
    ).toBe(0);
  });

  it('renvoie 0 sans plafond', () => {
    expect(
      getPointFaitPlafonne({
        pointPotentiel: 2,
        pointFait: 1,
        pointProgramme: null,
        pointPasFait: 0.5,
        pointNonRenseigne: 0.5,
      })
    ).toBe(0);
  });
});
