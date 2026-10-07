import { describe, expect, it } from 'vitest';
import { buildScoreDonutTooltip } from './build-score-donut-tooltip';

const MARKER = '<span></span>';

describe('buildScoreDonutTooltip', () => {
  it('affiche 128 points pour une somme de 128.00000000000003', () => {
    expect(
      buildScoreDonutTooltip({
        marker: MARKER,
        name: 'Non renseigné',
        points: 128.00000000000003,
        percent: 42,
      })
    ).toEqual(`${MARKER} Non renseigné: <b>128 points (42%)</b>`);
  });

  it('affiche 213,8 points pour une somme de 213.79999999999998', () => {
    expect(
      buildScoreDonutTooltip({
        marker: MARKER,
        name: 'Fait',
        points: 213.79999999999998,
        percent: 58,
      })
    ).toMatch(/^<span><\/span> Fait: <b>213[.,]8 points \(58%\)<\/b>$/);
  });

  it('accorde le libellé au singulier pour une somme de 1.0000000000000002', () => {
    expect(
      buildScoreDonutTooltip({
        marker: MARKER,
        name: 'Programmé',
        points: 1.0000000000000002,
        percent: 1,
      })
    ).toEqual(`${MARKER} Programmé: <b>1 point (1%)</b>`);
  });

  it('accorde le libellé au singulier pour une somme de 0', () => {
    expect(
      buildScoreDonutTooltip({
        marker: MARKER,
        name: 'Pas fait',
        points: 0,
        percent: 0,
      })
    ).toEqual(`${MARKER} Pas fait: <b>0 point (0%)</b>`);
  });
});
