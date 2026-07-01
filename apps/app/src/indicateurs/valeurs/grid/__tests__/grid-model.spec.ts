import { describe, expect, it } from 'vitest';
import { findCell, toDisplayRows } from '../grid-model';
import {
  cellKey,
  GridCell,
  GridRowGroup,
  toIndicateurId,
  toYear,
} from '../types';

const groups: GridRowGroup[] = [
  {
    id: 'residentiel',
    label: 'Résidentiel',
    rows: [
      { indicateurId: toIndicateurId(1), label: 'NOx' },
      { indicateurId: toIndicateurId(2), label: 'PM10' },
    ],
  },
  {
    id: 'tertiaire',
    label: 'Tertiaire',
    rows: [{ indicateurId: toIndicateurId(3), label: 'NOx' }],
  },
];

describe('toDisplayRows', () => {
  it('aplatit les groupes en lignes en portant le contexte de groupe', () => {
    const rows = toDisplayRows(groups);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      indicateurId: toIndicateurId(1),
      groupId: 'residentiel',
      isGroupStart: true,
      groupSize: 2,
    });
    expect(rows[1]).toMatchObject({
      indicateurId: toIndicateurId(2),
      isGroupStart: false,
      groupSize: 2,
    });
    expect(rows[2]).toMatchObject({
      indicateurId: toIndicateurId(3),
      groupId: 'tertiaire',
      isGroupStart: true,
      groupSize: 1,
    });
  });
});

describe('findCell', () => {
  it('retrouve une cellule par indicateur et année, sinon null', () => {
    const cell: GridCell = {
      kind: 'user-data',
      value: 42,
      valueId: 100,
      coveringSources: [],
    };
    const cells = new Map([[cellKey(toIndicateurId(1), toYear(2030)), cell]]);
    expect(
      findCell({ cells, indicateurId: toIndicateurId(1), year: toYear(2030) })
    ).toBe(cell);
    expect(
      findCell({ cells, indicateurId: toIndicateurId(9), year: toYear(2030) })
    ).toBeNull();
  });
});
