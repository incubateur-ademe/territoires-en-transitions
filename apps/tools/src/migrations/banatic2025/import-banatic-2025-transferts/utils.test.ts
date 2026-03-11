import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { parseCsvRows } from '../csv';
import {
  formatNatureTransfert,
  groupByEpci,
  parseAllRows,
  type ParsedRow,
} from './utils';

/**
 * High-level tests for Banatic 2025 competence transfers import.
 *
 * Requirements:
 * - Only extract rows where columns G & H are not empty
 * - Simple transfer: EPCI transfers to one syndicat
 *   Ex: "CC de la Veyle -> SM intercommunal Veyle Saône (18 communes)"
 * - Complex transfer: EPCI transfers to multiple syndicats with commune counts
 *   Ex: "CA Agglo Pays d'Issoire -> SICTOM Issoire-Brioude (69 communes), SICTOM des Couzes (18 communes)"
 */

const fixturesDir = path.join(__dirname, '__fixtures__');

const readFixture = (filename: string): string =>
  fs.readFileSync(path.join(fixturesDir, filename), 'utf-8');

describe('Banatic 2025 transferts import', () => {
  describe('filtering rows with transfer data', () => {
    it('should only keep rows where columns G & H are not empty', () => {
      const content = readFixture('transferts-mixed.csv');
      const rawRows = parseCsvRows(content);
      const parsedRows = parseAllRows(rawRows);

      // File has 7 data rows: 3 with transfers, 4 without (EPCI only)
      expect(parsedRows).toHaveLength(3);
      expect(parsedRows.map((r: ParsedRow) => r.communeName)).toEqual([
        'Antoingt',
        'Anzat-le-Luguet',
        'Apchat',
      ]);
    });
  });

  describe('multiple EPCIs with different transfer patterns', () => {
    it('should handle multiple EPCIs each with their own syndicats', () => {
      const content = readFixture('transferts-multiple-epci.csv');
      const rawRows = parseCsvRows(content);
      const parsedRows = parseAllRows(rawRows);
      const transfertsByEpci = groupByEpci(parsedRows);

      expect(transfertsByEpci.size).toBe(2);

      // CA Agglo Pays d'Issoire -> SICTOM Issoire-Brioude (2 communes)
      const caAgglo = transfertsByEpci.get('200070407');
      if (!caAgglo) throw new Error('CA Agglo not found');
      expect(formatNatureTransfert(caAgglo)).toBe(
        'SICTOM Issoire - Brioude (2 communes)'
      );

      // CC Dômes Sancy Artense -> 2 different syndicats
      const ccDomes = transfertsByEpci.get('200069169');
      if (!ccDomes) throw new Error('CC Dômes not found');
      expect(ccDomes.syndicats.size).toBe(2);

      const natureTransfert = formatNatureTransfert(ccDomes);
      expect(natureTransfert).toBe(
        'SM de collecte des déchets ménagers Dômes et Combrailles (1 commune), SMCTOM de la Haute Dordogne (2 communes)'
      );
    });
  });
});
