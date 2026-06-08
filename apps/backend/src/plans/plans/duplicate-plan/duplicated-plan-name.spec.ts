import { describe, expect, it } from 'vitest';
import { buildDuplicatedPlanName } from './duplicated-plan-name';

describe('buildDuplicatedPlanName', () => {
  it('suffixe le nom source avec la date et l\'heure de duplication', () => {
    const instant = new Date('2026-06-04T17:08:05');

    expect(buildDuplicatedPlanName('Plan vélo', instant)).toBe(
      'Plan vélo (copie du 04/06/2026 à 17:08:05)'
    );
  });

  it('distingue deux duplications du même plan le même jour', () => {
    const matin = new Date('2026-06-04T09:30:00');
    const apresMidi = new Date('2026-06-04T14:45:12');

    expect(buildDuplicatedPlanName('Plan vélo', matin)).not.toBe(
      buildDuplicatedPlanName('Plan vélo', apresMidi)
    );
  });

  it('reste robuste quand le plan source n\'a pas de nom', () => {
    const instant = new Date('2026-06-04T17:08:05');

    expect(buildDuplicatedPlanName(null, instant)).toBe(
      'Plan (copie du 04/06/2026 à 17:08:05)'
    );
  });
});
