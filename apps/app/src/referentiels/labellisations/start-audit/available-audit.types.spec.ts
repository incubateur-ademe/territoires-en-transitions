import { describe, expect, it } from 'vitest';
import { availableAuditTypes } from './available-audit.types';

describe('availableAuditTypes', () => {
  it('active les trois types quand la collectivité est labellisable', () => {
    const options = availableAuditTypes({
      labellisable: true,
      canTargetAuditStar: true,
    });
    expect(options.map((option) => option.sujet)).toEqual([
      'cot',
      'labellisation_cot',
      'labellisation',
    ]);
    expect(options.every((option) => !option.disabled)).toBe(true);
  });

  it('désactive les variantes labellisantes quand la collectivité ne l\'est pas', () => {
    const options = availableAuditTypes({
      labellisable: false,
      canTargetAuditStar: true,
    });
    const bySujet = (sujet: string) =>
      options.find((option) => option.sujet === sujet);
    expect(bySujet('cot')?.disabled).toBe(false);
    expect(bySujet('labellisation_cot')?.disabled).toBe(true);
    expect(bySujet('labellisation')?.disabled).toBe(true);
  });

  it('désactive les variantes labellisantes quand aucune étoile d\'audit n\'est atteignable', () => {
    const options = availableAuditTypes({
      labellisable: true,
      canTargetAuditStar: false,
    });
    expect(
      options.find((option) => option.sujet === 'labellisation')?.disabled
    ).toBe(true);
  });
});
