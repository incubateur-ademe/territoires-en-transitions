import { describe, expect, it } from 'vitest';
import {
  rowDragId,
  yearDragId,
} from '../../../indicateurs/valeurs/grid/drag-reorder/use-grid-reorder';
import {
  toIndicateurId,
  toYear,
} from '../../../indicateurs/valeurs/grid/types';
import { IndicateurGridShape } from '../../../indicateurs/valeurs/grid/indicateur-grid-shape';
import { reorderRows } from './reorder-rows';

const initialShape: IndicateurGridShape = {
  NOx: {
    Résidentiel: 'cae_4.aa',
    Agriculture: 'cae_4.ac',
    Transport: 'cae_4.ae',
  },
};

const identifiantReferentielByIndicateurId = new Map<number, string>([
  [11, 'cae_4.aa'],
  [13, 'cae_4.ac'],
  [15, 'cae_4.ae'],
]);

describe('reorderRows', () => {
  it('deplace la ligne active a la position de la ligne survolee', () => {
    expect(
      reorderRows({
        initialShape,
        rowOrder: {},
        identifiantReferentielByIndicateurId,
        groupId: 'NOx',
        activeId: rowDragId(toIndicateurId(15)),
        overId: rowDragId(toIndicateurId(11)),
      })
    ).toEqual({ NOx: ['cae_4.ae', 'cae_4.aa', 'cae_4.ac'] });
  });

  it('rend null pour un drag qui n est pas une ligne', () => {
    expect(
      reorderRows({
        initialShape,
        rowOrder: {},
        identifiantReferentielByIndicateurId,
        groupId: 'NOx',
        activeId: yearDragId(toYear(2030)),
        overId: rowDragId(toIndicateurId(11)),
      })
    ).toBeNull();
  });

  it('rend null quand un identifiant n est pas resolu', () => {
    expect(
      reorderRows({
        initialShape,
        rowOrder: {},
        identifiantReferentielByIndicateurId: new Map<number, string>([[11, 'cae_4.aa']]),
        groupId: 'NOx',
        activeId: rowDragId(toIndicateurId(15)),
        overId: rowDragId(toIndicateurId(11)),
      })
    ).toBeNull();
  });
});
