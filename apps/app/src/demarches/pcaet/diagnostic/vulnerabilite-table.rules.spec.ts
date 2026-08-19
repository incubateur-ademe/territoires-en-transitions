import type {
  DemarchePcaetVulnerabilite,
  DemarchePcaetVulnerabiliteDomaine,
} from '@tet/domain/demarches';
import { describe, expect, it } from 'vitest';
import {
  NIVEAU_COLUMNS,
  OBJECTIF_COLUMNS,
  toVulnerabiliteRows,
} from './vulnerabilite-table.rules';

const domaine = (
  overrides: Partial<DemarchePcaetVulnerabiliteDomaine> = {}
): DemarchePcaetVulnerabiliteDomaine => ({
  id: 1,
  code: 'eau',
  label: 'Eau',
  requis: true,
  isSocle: true,
  ...overrides,
});

const vulnerabilite = (
  overrides: Partial<DemarchePcaetVulnerabilite> = {}
): DemarchePcaetVulnerabilite => ({
  domaines: [domaine()],
  lignes: [],
  ...overrides,
});

describe('colonnes du tableau', () => {
  it('ouvre une colonne d’objectifs par horizon de projection', () => {
    expect(OBJECTIF_COLUMNS.map((col) => [col.key, col.horizon])).toEqual([
      ['objectifs2050', '2050'],
      ['objectifs2100', '2100'],
    ]);
  });

  it('ordonne les horizons du constat vers la projection la plus lointaine', () => {
    expect(NIVEAU_COLUMNS.map((col) => col.horizon)).toEqual([
      'maintenant',
      '2050',
      '2100',
    ]);
  });
});

describe('toVulnerabiliteRows', () => {
  it('suit l’ordre des domaines, pas celui des lignes', () => {
    const rows = toVulnerabiliteRows(
      vulnerabilite({
        domaines: [
          domaine({ id: 1, code: 'eau', label: 'Eau' }),
          domaine({ id: 2, code: 'foret', label: 'Forêt' }),
        ],
        lignes: [
          {
            domaineId: 2,
            niveauMaintenant: 'fort',
            niveau2050: null,
            niveau2100: null,
            objectifs2050: null,
            objectifs2100: null,
          },
        ],
      })
    );

    expect(rows.map((row) => row.domaine.label)).toEqual(['Eau', 'Forêt']);
    expect(rows[1].ligne.niveauMaintenant).toBe('fort');
  });

  it('donne une ligne vierge au domaine sans saisie', () => {
    const [row] = toVulnerabiliteRows(vulnerabilite());

    expect(row.ligne).toEqual({
      domaineId: 1,
      niveauMaintenant: null,
      niveau2050: null,
      niveau2100: null,
      objectifs2050: null,
      objectifs2100: null,
    });
  });

  // Une photo figée par une version antérieure peut ne pas porter la ligne.
  it('ne perd pas de ligne quand la saisie manque à l’appel', () => {
    const rows = toVulnerabiliteRows(
      vulnerabilite({
        domaines: [domaine({ id: 1 }), domaine({ id: 2, code: 'foret' })],
        lignes: [],
      })
    );

    expect(rows).toHaveLength(2);
  });

  it('ignore une ligne dont le domaine n’est plus rattaché', () => {
    const rows = toVulnerabiliteRows(
      vulnerabilite({
        domaines: [domaine({ id: 1 })],
        lignes: [
          {
            domaineId: 99,
            niveauMaintenant: 'moyen',
            niveau2050: null,
            niveau2100: null,
            objectifs2050: null,
            objectifs2100: null,
          },
        ],
      })
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].ligne.niveauMaintenant).toBeNull();
  });
});
