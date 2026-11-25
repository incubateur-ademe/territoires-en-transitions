import { IndicateurPeriodes } from '@tet/domain/indicateurs';
import { describe, expect, it } from 'vitest';
import { toOpenDataRows } from './to-open-data-rows';

const ROW = { rowKey: '32/224', color: 'primary-9', depth: 0 };
const annee = (year: number) =>
  IndicateurPeriodes.containing('annuelle', `${year}-01-01`);

const rows = toOpenDataRows({
  row: ROW,
  periodicite: 'annuelle',
  openData: {
    sources: [
      {
        id: 'insee',
        label: 'INSEE',
        valeurs: [
          { dateValeur: '2009-01-01', resultat: 18.13, objectif: null },
        ],
      },
    ],
    moyenne: { valeurs: [{ dateValeur: '2014-01-01', valeur: 33.75 }] },
  },
});

describe('toOpenDataRows', () => {
  it('produit une ligne par source open data puis la ligne de moyenne, clés rattachées à celle du sous-indicateur', () => {
    expect(rows.map(({ key }) => key)).toEqual([
      '32/224/insee',
      '32/224/moyenne',
    ]);
  });

  it('lit la valeur de la source sur sa période, en lecture seule', () => {
    expect(rows[0].cellOf(annee(2009))).toEqual({
      kind: 'valeurs',
      resultat: 18.13,
      objectif: null,
      isReadonly: true,
      emptyLabel: expect.any(String),
      dataSource: 'insee',
    });
  });

  it("laisse vide une période où la source n'a pas de valeur", () => {
    expect(rows[0].cellOf(annee(2014))).toMatchObject({
      resultat: null,
      objectif: null,
    });
  });

  it('lit la moyenne comme un résultat, sans objectif', () => {
    expect(rows[1].cellOf(annee(2014))).toMatchObject({
      resultat: 33.75,
      objectif: null,
      isReadonly: true,
    });
  });

  it("n'accepte aucune saisie dans ces lignes", async () => {
    await expect(rows[0].onSave(annee(2009), 'resultat', 1)).resolves.toBe(
      false
    );
  });
});
