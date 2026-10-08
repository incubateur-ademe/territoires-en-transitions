import { describe, expect, it } from 'vitest';
import { formatPlanSecteursCounts } from './format-plan-secteurs-counts';

describe('formatPlanSecteursCounts', () => {
  it('liste les comptes non nuls, en regroupant à renseigner et non attribuables', () => {
    expect(
      formatPlanSecteursCounts({
        planId: 1,
        enCoursDeCalcul: 2,
        aRenseigner: 1,
        nonAttribuables: 3,
      })
    ).toEqual(['2 en cours de calcul', '4 à renseigner']);
  });

  it('omet les comptes nuls', () => {
    expect(
      formatPlanSecteursCounts({
        planId: 1,
        enCoursDeCalcul: 0,
        aRenseigner: 0,
        nonAttribuables: 1,
      })
    ).toEqual(['1 à renseigner']);
  });

  it('renvoie une liste vide quand les trois comptes sont nuls', () => {
    expect(
      formatPlanSecteursCounts({
        planId: 1,
        enCoursDeCalcul: 0,
        aRenseigner: 0,
        nonAttribuables: 0,
      })
    ).toEqual([]);
  });
});
