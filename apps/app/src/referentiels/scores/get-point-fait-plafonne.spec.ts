import { describe, expect, it } from 'vitest';
import { getPointFaitPlafonne } from './get-point-fait-plafonne';

describe('getPointFaitPlafonne', () => {
  it('renvoie les points retirés par le plafond (cas CAE 3.3.5)', () => {
    // 3.3.5 : 1,42 pt fait ramené à 0,88 (44 % comme la 1.2.3)
    expect(
      getPointFaitPlafonne({
        actionId: 'cae_3.3.5',
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
        actionId: 'cae_3.3.5.1',
        pointPotentiel: 1,
        pointFait: 0.333,
        pointProgramme: 0.333,
        pointPasFait: 0.333,
        pointNonRenseigne: 0,
      })
    ).toBe(0);
    expect(
      getPointFaitPlafonne({
        actionId: 'cae_3.3.5.1',
        pointPotentiel: 1,
        pointFait: 0.249,
        pointProgramme: 0.249,
        pointPasFait: 0.249,
        pointNonRenseigne: 0.251,
      })
    ).toBe(0);
  });

  it('renvoie 0 sans plafond', () => {
    expect(
      getPointFaitPlafonne({
        actionId: 'cae_3.3.5',
        pointPotentiel: 2,
        pointFait: 1,
        pointProgramme: null,
        pointPasFait: 0.5,
        pointNonRenseigne: 0.5,
      })
    ).toBe(0);
  });

  it('ignore un écart hors mesure plafonnée (tâches toutes non concernées)', () => {
    expect(
      getPointFaitPlafonne({
        actionId: 'cae_3.3.4.2',
        pointPotentiel: 1,
        pointFait: 0,
        pointProgramme: 0,
        pointPasFait: 0,
        pointNonRenseigne: 0,
      })
    ).toBe(0);
  });

  it("renvoie l'écart aux ancêtres de la 3.3.5", () => {
    expect(
      getPointFaitPlafonne({
        actionId: 'cae_3',
        pointPotentiel: 50,
        pointFait: 20,
        pointProgramme: 10,
        pointPasFait: 19.46,
        pointNonRenseigne: 0,
      })
    ).toBeCloseTo(0.54);
  });
});
