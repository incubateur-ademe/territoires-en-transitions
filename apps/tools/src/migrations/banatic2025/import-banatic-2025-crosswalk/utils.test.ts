import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { parseCsvRows } from '../csv';
import {
  determineMappingTypes,
  parseCrosswalkRows,
  type CrosswalkRow,
} from './utils';

/**
 * Fixture covers all row patterns from the real Banatic crosswalk CSV:
 *
 *   - C1004 → C1005 + C1010   (split: one old code maps to 2 new codes)
 *   - C1020 → C1015            (one_to_one)
 *   - C1025 → C1020            (one_to_one)
 *   - C1035, C1040              (new-only codes, no predecessor → skipped)
 *   - C1502 → C1505            (one_to_one)
 *   - C1505 → C1510            (one_to_one)
 *   - C1010, C1030, C4555       (abandoned codes → no_equivalent)
 */

const fixturesDir = path.join(__dirname, '__fixtures__');

const readFixture = (filename: string): string =>
  fs.readFileSync(path.join(fixturesDir, filename), 'utf-8');

const parseFixture = (): CrosswalkRow[] => {
  const content = readFixture('crosswalk.csv');
  const rawRows = parseCsvRows(content, { delimiter: ';' });
  return parseCrosswalkRows(rawRows);
};

describe('Banatic crosswalk parsing', () => {
  describe('parseCrosswalkRows', () => {
    it('should parse all mapping rows from the fixture', () => {
      const rows = parseFixture();
      // 2 (C1004 split) + 1 (C1020) + 1 (C1025) + 1 (C1502) + 1 (C1505) + 3 (abandoned) = 9
      expect(rows).toHaveLength(9);
    });

    it('should handle one_to_one mappings', () => {
      const rows = parseFixture();

      expect(rows).toContainEqual({ code2021: 1020, code2025: 1015 });
      expect(rows).toContainEqual({ code2021: 1025, code2025: 1020 });
      expect(rows).toContainEqual({ code2021: 1502, code2025: 1505 });
      expect(rows).toContainEqual({ code2021: 1505, code2025: 1510 });
    });

    it('should handle split mappings via arrow continuation rows', () => {
      const rows = parseFixture();

      const c1004Rows = rows.filter((r) => r.code2021 === 1004);
      expect(c1004Rows).toHaveLength(2);
      expect(c1004Rows).toContainEqual({ code2021: 1004, code2025: 1005 });
      expect(c1004Rows).toContainEqual({ code2021: 1004, code2025: 1010 });
    });

    it('should skip new-only codes (no old code, no arrow)', () => {
      const rows = parseFixture();

      // C1035 and C1040 are new-only codes, they should not appear
      expect(rows.find((r) => r.code2025 === 1035)).toBeUndefined();
      expect(rows.find((r) => r.code2025 === 1040)).toBeUndefined();
    });

    it('should handle abandoned codes with no new equivalent', () => {
      const rows = parseFixture();

      expect(rows).toContainEqual({ code2021: 1010, code2025: null });
      expect(rows).toContainEqual({ code2021: 1030, code2025: null });
      expect(rows).toContainEqual({ code2021: 4555, code2025: null });
    });
  });

  describe('determineMappingTypes', () => {
    it('should classify one_to_one, split, and no_equivalent correctly', () => {
      const rows = parseFixture();
      const types = determineMappingTypes(rows);

      expect(types.get(1004)).toBe('split');

      expect(types.get(1020)).toBe('one_to_one');
      expect(types.get(1025)).toBe('one_to_one');
      expect(types.get(1502)).toBe('one_to_one');
      expect(types.get(1505)).toBe('one_to_one');

      expect(types.get(1010)).toBe('no_equivalent');
      expect(types.get(1030)).toBe('no_equivalent');
      expect(types.get(4555)).toBe('no_equivalent');
    });

    it('should count distinct old codes per mapping type', () => {
      const rows = parseFixture();
      const types = determineMappingTypes(rows);

      const stats = { one_to_one: 0, split: 0, no_equivalent: 0 };
      for (const type of types.values()) {
        stats[type]++;
      }

      expect(stats.one_to_one).toBe(4);
      expect(stats.split).toBe(1);
      expect(stats.no_equivalent).toBe(3);
    });
  });
});
