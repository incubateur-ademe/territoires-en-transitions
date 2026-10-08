import { describe, expect, it } from 'vitest';
import { IndicateurPeriodes } from './indicateur-periode';

describe('IndicateurPeriodes', () => {
  it('merges persisted and draft periods by identity, in chronological order', () => {
    const persisted = [2027, 2025].map(IndicateurPeriodes.fromYear);
    const drafts = [2026, 2025].map(IndicateurPeriodes.fromYear);

    const periodes = IndicateurPeriodes.merge(persisted, drafts);

    expect(periodes.map(IndicateurPeriodes.key)).toEqual([
      'annuelle:2025-01-01',
      'annuelle:2026-01-01',
      'annuelle:2027-01-01',
    ]);
    expect(persisted.map(IndicateurPeriodes.format)).toEqual(['2027', '2025']);
    expect(drafts.map(IndicateurPeriodes.format)).toEqual(['2026', '2025']);
  });

  it('preserves the canonical start date through merging and formatting', () => {
    const periode = IndicateurPeriodes.fromYear(1);

    expect(IndicateurPeriodes.merge([], [periode])).toEqual([
      { periodicite: 'annuelle', dateDebut: '0001-01-01' },
    ]);
    expect(IndicateurPeriodes.format(periode)).toBe('1');
    expect(IndicateurPeriodes.merge()).toEqual([]);
  });
});
