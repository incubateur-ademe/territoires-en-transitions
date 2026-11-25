import { describe, expect, it } from 'vitest';
import {
  listVisibleRows,
  toggleRowKey,
} from './sous-indicateurs-table-expansion.rules';
import type { SousIndicateurTableRow } from './sous-indicateurs-table.rules';

const toRow = ({
  rowKey,
  parentRowKey,
}: {
  rowKey: string;
  parentRowKey: string | null;
}): SousIndicateurTableRow => ({
  rowKey,
  parentRowKey,
  isExpandable: false,
  indicateurId: Number(rowKey.split('/').at(-1)),
  label: rowKey,
  color: '',
  depth: rowKey.split('/').length - 2,
  cells: [],
});

const rows = [
  toRow({ rowKey: '1/2', parentRowKey: null }),
  toRow({ rowKey: '1/2/4', parentRowKey: '1/2' }),
  toRow({ rowKey: '1/2/4/6', parentRowKey: '1/2/4' }),
  toRow({ rowKey: '1/3', parentRowKey: null }),
];

const toVisibleRowKeys = (expandedRowKeys: readonly string[]) =>
  listVisibleRows({ rows, expandedRowKeys: new Set(expandedRowKeys) }).map(
    ({ rowKey }) => rowKey
  );

describe('listVisibleRows', () => {
  it("ne montre que les enfants directs de la racine quand rien n'est déplié", () => {
    expect(toVisibleRowKeys([])).toEqual(['1/2', '1/3']);
  });

  it("montre les enfants d'une ligne dépliée", () => {
    expect(toVisibleRowKeys(['1/2'])).toEqual(['1/2', '1/2/4', '1/3']);
  });

  it('montre tous les niveaux quand chaque ligne est dépliée', () => {
    expect(toVisibleRowKeys(['1/2', '1/2/4'])).toEqual([
      '1/2',
      '1/2/4',
      '1/2/4/6',
      '1/3',
    ]);
  });

  it("cache les petits-enfants d'une ligne repliée même quand leur parent reste marqué déplié", () => {
    expect(toVisibleRowKeys(['1/2/4'])).toEqual(['1/2', '1/3']);
  });
});

describe('toggleRowKey', () => {
  it("ajoute la clé d'une ligne repliée", () => {
    expect(
      toggleRowKey({ expandedRowKeys: new Set(['1/3']), rowKey: '1/2' })
    ).toEqual(new Set(['1/3', '1/2']));
  });

  it("retire la clé d'une ligne dépliée", () => {
    expect(
      toggleRowKey({ expandedRowKeys: new Set(['1/2', '1/3']), rowKey: '1/2' })
    ).toEqual(new Set(['1/3']));
  });

  it("ne modifie pas l'ensemble reçu", () => {
    const expandedRowKeys = new Set(['1/2']);

    toggleRowKey({ expandedRowKeys, rowKey: '1/3' });

    expect(expandedRowKeys).toEqual(new Set(['1/2']));
  });
});
