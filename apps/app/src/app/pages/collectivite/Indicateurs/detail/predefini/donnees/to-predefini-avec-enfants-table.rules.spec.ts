import type { PeriodeTableRow } from '@/app/indicateurs/valeurs/periodes-table/periodes-table.types';
import { IndicateurPeriodes } from '@tet/domain/indicateurs';
import { describe, expect, it } from 'vitest';
import type { SousIndicateurTableRow } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-table.rules';
import {
  listGroupingRowKeys,
  toBlankedGroupingRows,
  toPredefiniAvecEnfantsTable,
} from './to-predefini-avec-enfants-table.rules';

const annee = (year: number) =>
  IndicateurPeriodes.containing('annuelle', `${year}-01-01`);

const toRow = (key: string): PeriodeTableRow => ({
  key,
  title: key,
  cellOf: () => ({
    kind: 'contenu',
    content: null,
    isBold: false,
  }),
  onSave: () => Promise.resolve(true),
});

describe('toPredefiniAvecEnfantsTable', () => {
  it('place les lignes des valeurs propres avant celles des sous-indicateurs', () => {
    const { rows } = toPredefiniAvecEnfantsTable({
      valeursPropres: {
        periodes: [],
        rows: [toRow('collectivite'), toRow('insee')],
      },
      enfants: { periodes: [], rows: [toRow('11'), toRow('12')] },
    });

    expect(rows.map(({ key }) => key)).toEqual([
      'collectivite',
      'insee',
      '11',
      '12',
    ]);
  });

  it('réunit dans l’ordre chronologique les périodes du parent et celles des sous-indicateurs sans doublon', () => {
    const { periodes } = toPredefiniAvecEnfantsTable({
      valeursPropres: { periodes: [annee(2022), annee(2020)], rows: [] },
      enfants: { periodes: [annee(2021), annee(2022)], rows: [] },
    });

    expect(periodes.map(IndicateurPeriodes.key)).toEqual(
      [annee(2020), annee(2021), annee(2022)].map(IndicateurPeriodes.key)
    );
  });

  it("garde les lignes des sous-indicateurs quand le parent n'a aucune valeur propre", () => {
    const { periodes, rows } = toPredefiniAvecEnfantsTable({
      valeursPropres: { periodes: [], rows: [] },
      enfants: { periodes: [annee(2020)], rows: [toRow('11')] },
    });

    expect(rows.map(({ key }) => key)).toEqual(['11']);
    expect(periodes).toHaveLength(1);
  });
});

describe('listGroupingRowKeys', () => {
  const toTableRow = ({
    rowKey,
    isExpandable,
    acceptsOwnValeurs,
  }: {
    rowKey: string;
    isExpandable: boolean;
    acceptsOwnValeurs: boolean;
  }): SousIndicateurTableRow => ({
    rowKey,
    parentRowKey: null,
    isExpandable,
    acceptsOwnValeurs,
    indicateurId: 1,
    label: rowKey,
    color: 'x',
    depth: 0,
    cells: [
      {
        dateValeur: '2020-01-01',
        resultat: { status: 'empty' },
        objectif: { status: 'empty' },
      },
    ],
  });

  it("retient un sous-indicateur qui a des enfants et n'accepte aucune valeur : il ne fait que regrouper", () => {
    expect(
      listGroupingRowKeys([
        toTableRow({
          rowKey: 'groupe',
          isExpandable: true,
          acceptsOwnValeurs: false,
        }),
      ])
    ).toEqual(new Set(['groupe']));
  });

  it('ne retient pas un sous-indicateur qui a des enfants et accepte des valeurs propres, même sans valeur : il reste à renseigner', () => {
    expect(
      listGroupingRowKeys([
        toTableRow({
          rowKey: 'groupe',
          isExpandable: true,
          acceptsOwnValeurs: true,
        }),
      ])
    ).toEqual(new Set());
  });

  it('ne retient pas une feuille, qui reste à renseigner', () => {
    expect(
      listGroupingRowKeys([
        toTableRow({
          rowKey: 'feuille',
          isExpandable: false,
          acceptsOwnValeurs: false,
        }),
      ])
    ).toEqual(new Set());
  });
});

describe('toBlankedGroupingRows', () => {
  it('vide les cellules des lignes de regroupement et laisse les autres intactes', () => {
    const rows = toBlankedGroupingRows({
      rows: [toRow('groupe'), toRow('feuille')],
      groupingRowKeys: new Set(['groupe']),
    });

    expect(rows[0].cellOf(annee(2020))).toEqual({
      kind: 'contenu',
      content: null,
      isBold: false,
    });
    expect(rows[1]).toBe(rows[1]);
    expect(rows.map(({ key }) => key)).toEqual(['groupe', 'feuille']);
  });
});
