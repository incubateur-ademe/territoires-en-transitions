import { describe, expect, it } from 'vitest';
import { shapeIdentifiants } from '../../../indicateurs/valeurs/grid/indicateur-grid-shape';
import { POLLUANTS_ATMOSPHERIQUES_GRID_SHAPE } from './polluants-atmospheriques.grid-shape';

describe('POLLUANTS_ATMOSPHERIQUES_GRID_SHAPE', () => {
  it('décrit 6 polluants de 9 secteurs, identifiants cae_4.<polluant><secteur>', () => {
    expect(Object.keys(POLLUANTS_ATMOSPHERIQUES_GRID_SHAPE)).toEqual([
      'NOx',
      'PM10',
      'PM2.5',
      'COVNM',
      'SO2',
      'NH3',
    ]);
    expect(POLLUANTS_ATMOSPHERIQUES_GRID_SHAPE.NOx.Résidentiel).toBe('cae_4.aa');
    expect(POLLUANTS_ATMOSPHERIQUES_GRID_SHAPE.NH3.Chantiers).toBe('cae_4.fi');
    expect(shapeIdentifiants(POLLUANTS_ATMOSPHERIQUES_GRID_SHAPE)).toHaveLength(
      54
    );
  });
});
