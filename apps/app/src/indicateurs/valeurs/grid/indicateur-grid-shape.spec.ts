import { describe, expect, it } from 'vitest';
import {
  applyRowOrder,
  IndicateurGridShape,
  shapeToGridGroups,
} from './indicateur-grid-shape';

describe('shapeToGridGroups', () => {
  it('résout les identifiants en indicateurIds en conservant l\'ordre de la shape', () => {
    const shape: IndicateurGridShape = {
      NOx: { Résidentiel: 'cae_4.aa', Agriculture: 'cae_4.ac' },
    };
    const indicateurIdByIdentifiantReferentiel = new Map([
      ['cae_4.aa', 11],
      ['cae_4.ac', 13],
    ]);

    expect(shapeToGridGroups(shape, indicateurIdByIdentifiantReferentiel)).toEqual({
      NOx: {
        label: 'NOx',
        rows: [
          { indicateurId: 11, label: 'Résidentiel' },
          { indicateurId: 13, label: 'Agriculture' },
        ],
      },
    });
  });

  it('ignore une ligne dont l\'identifiant n\'est pas résolu', () => {
    const shape: IndicateurGridShape = {
      NOx: { Résidentiel: 'cae_4.aa', Inconnu: 'cae_4.zz' },
    };

    const groups = shapeToGridGroups(shape, new Map([['cae_4.aa', 11]]));

    expect(groups.NOx.rows).toEqual([{ indicateurId: 11, label: 'Résidentiel' }]);
  });
});

describe('applyRowOrder', () => {
  const shape: IndicateurGridShape = {
    NOx: {
      Résidentiel: 'cae_4.aa',
      Agriculture: 'cae_4.ac',
      Transport: 'cae_4.ae',
    },
  };

  it('réordonne les lignes du groupe selon les identifiants stockés', () => {
    expect(
      Object.entries(
        applyRowOrder(shape, { NOx: ['cae_4.ae', 'cae_4.aa', 'cae_4.ac'] }).NOx
      )
    ).toEqual([
      ['Transport', 'cae_4.ae'],
      ['Résidentiel', 'cae_4.aa'],
      ['Agriculture', 'cae_4.ac'],
    ]);
  });

  it('garde l\'ordre initial pour un groupe sans ordre stocké', () => {
    expect(Object.entries(applyRowOrder(shape, {}).NOx)).toEqual(
      Object.entries(shape.NOx)
    );
  });

  it('place les lignes absentes de l\'ordre stocké après les lignes ordonnées', () => {
    expect(
      Object.entries(applyRowOrder(shape, { NOx: ['cae_4.ae'] }).NOx)
    ).toEqual([
      ['Transport', 'cae_4.ae'],
      ['Résidentiel', 'cae_4.aa'],
      ['Agriculture', 'cae_4.ac'],
    ]);
  });
});
