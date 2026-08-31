import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { parseCsvRecords } from '../csv';
import {
  collectDeclaredNbMembres,
  countCommunesByEpci,
  diffRecomptageVsDeclare,
  parsePerimetreRecords,
} from './utils';

const fixturesDir = path.join(__dirname, '__fixtures__');

const readFixture = (filename: string): string =>
  fs.readFileSync(path.join(fixturesDir, filename), 'utf-8');

describe('Banatic 2025 périmètre import', () => {
  const rows = parsePerimetreRecords(
    parseCsvRecords(readFixture('perimetre-sample.csv'), { delimiter: ';' })
  );

  it('compte les communes distinctes par SIREN d\'EPCI (dédoublonnage)', () => {
    const countByEpci = countCommunesByEpci(rows);

    // Rouen : 4 lignes dont 1 doublon -> 3 communes distinctes
    expect(countByEpci.get('200023414')).toBe(3);
  });

  it('ne filtre pas les petites communes', () => {
    const countByEpci = countCommunesByEpci(rows);

    // CA Agglo Pays d'Issoire : Issoire + Antoingt (pmun 110) -> 2
    expect(countByEpci.get('200070407')).toBe(2);
  });

  it('gère un EPCI à une seule commune', () => {
    const countByEpci = countCommunesByEpci(rows);

    expect(countByEpci.get('200099999')).toBe(1);
  });

  it('ignore les lignes sans SIREN EPCI ou sans code INSEE', () => {
    const parsed = parsePerimetreRecords([
      { siren: '200023414', insee: '76540' },
      { siren: '', insee: '76451' },
      { siren: '200023414', insee: '' },
      { siren: '200023414', insee: '76575' },
    ]);

    expect(parsed).toHaveLength(2);
    expect(countCommunesByEpci(parsed).get('200023414')).toBe(2);
  });

  describe('contrôle nb_membres déclaré', () => {
    it('lit nb_membres une fois par EPCI (espaces tolérés)', () => {
      const declare = collectDeclaredNbMembres([
        { siren: '200023414', insee: '76540', nb_membres: '3' },
        { siren: '200023414', insee: '76451', nb_membres: '3' },
        { siren: '200099999', insee: '63999', nb_membres: '1 234' },
      ]);

      expect(declare.get('200023414')).toBe(3);
      expect(declare.get('200099999')).toBe(1234);
    });

    it("la fixture est cohérente : aucun écart recomptage / nb_membres", () => {
      const records = parseCsvRecords(readFixture('perimetre-sample.csv'), {
        delimiter: ';',
      });
      const ecarts = diffRecomptageVsDeclare(
        countCommunesByEpci(rows),
        collectDeclaredNbMembres(records)
      );

      expect(ecarts).toEqual([]);
    });

    it('remonte un écart quand le recomptage diffère de nb_membres', () => {
      const records = [
        { siren: '200000001', insee: '11111', nb_membres: '3' },
        { siren: '200000001', insee: '22222', nb_membres: '3' },
      ];
      const ecarts = diffRecomptageVsDeclare(
        countCommunesByEpci(parsePerimetreRecords(records)),
        collectDeclaredNbMembres(records)
      );

      expect(ecarts).toEqual([
        { epciSiren: '200000001', recompte: 2, declare: 3 },
      ]);
    });
  });
});
