import { describe, expect, it } from 'vitest';
import { IndicateurPeriodes } from './indicateur-periode';

describe('IndicateurPeriodes', () => {
  it.each<[string, string | null]>([
    ['', ''],
    ['2', '2'],
    ['20', '20'],
    ['202', '202'],
    ['0000', '0000'],
    ['0001', '0001'],
    ['2026', '2026'],
    ['2a0b2c6', '2026'],
    ['abc-+.,', ''],
    ['20261', null],
    ['2026-01', null],
    ['2026-T1', null],
    ['2026-S1', null],
  ])('normalizes the annual draft %j to %j', (value, expected) => {
    expect(IndicateurPeriodes.normalizeDraft('annuelle', value)).toBe(expected);
  });

  it('accepts incomplete or invalid drafts without making them valid periods', () => {
    for (const value of ['', '2', '20', '202', '0000']) {
      const draft = IndicateurPeriodes.normalizeDraft('annuelle', value);

      expect(draft).toBe(value);
      expect(IndicateurPeriodes.parse('annuelle', value)).toBeNull();
    }
  });

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
