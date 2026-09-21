import type {
  DemarchePcaetVulnerabilite,
  DemarchePcaetVulnerabiliteThematique,
} from '@tet/domain/demarches';
import { describe, expect, it } from 'vitest';
import {
  NIVEAU_COLUMNS,
  OBJECTIF_COLUMNS,
  toVulnerabiliteRows,
} from './vulnerabilite-table.rules';

const thematique = (
  overrides: Partial<DemarchePcaetVulnerabiliteThematique> = {}
): DemarchePcaetVulnerabiliteThematique => ({
  id: 1,
  code: 'eau',
  label: 'Eau',
  parentId: null,
  requis: true,
  isSocle: true,
  ...overrides,
});

const vulnerabilite = (
  overrides: Partial<DemarchePcaetVulnerabilite> = {}
): DemarchePcaetVulnerabilite => ({
  thematiques: [thematique()],
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
  it('suit l’ordre des thématiques, pas celui des lignes', () => {
    const rows = toVulnerabiliteRows(
      vulnerabilite({
        thematiques: [
          thematique({ id: 1, code: 'eau', label: 'Eau' }),
          thematique({ id: 2, code: 'foret', label: 'Forêt' }),
        ],
        lignes: [
          {
            thematiqueId: 2,
            niveauMaintenant: 'fort',
            niveau2050: null,
            niveau2100: null,
            objectifs2050: null,
            objectifs2100: null,
          },
        ],
      })
    );

    expect(rows.map((row) => row.thematique.label)).toEqual(['Eau', 'Forêt']);
    expect(rows[1].ligne.niveauMaintenant).toBe('fort');
  });

  it('donne une ligne vierge à la thématique sans saisie', () => {
    const [row] = toVulnerabiliteRows(vulnerabilite());

    expect(row.ligne).toEqual({
      thematiqueId: 1,
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
        thematiques: [
          thematique({ id: 1 }),
          thematique({ id: 2, code: 'foret' }),
        ],
        lignes: [],
      })
    );

    expect(rows).toHaveLength(2);
  });

  it('ignore une ligne dont la thématique n’est plus rattachée', () => {
    const rows = toVulnerabiliteRows(
      vulnerabilite({
        thematiques: [thematique({ id: 1 })],
        lignes: [
          {
            thematiqueId: 99,
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

describe('hiérarchie parent / enfant', () => {
  const risquesNaturels = thematique({
    id: 10,
    code: 'risques_naturels',
    label: 'Risques naturels',
  });
  const secheresse = thematique({
    id: 11,
    code: 'risque_secheresse',
    label: 'Sécheresse',
    parentId: 10,
  });
  const inondation = thematique({
    id: 12,
    code: 'risque_inondation',
    label: 'Inondation',
    parentId: 10,
  });

  it('range chaque sous-thématique derrière sa parente', () => {
    const rows = toVulnerabiliteRows(
      vulnerabilite({
        // Le serveur peut servir les enfants avant leur parente : le tableau
        // ne doit pas dépendre de cet ordre.
        thematiques: [
          secheresse,
          thematique({ id: 1, code: 'eau', label: 'Eau' }),
          risquesNaturels,
          inondation,
        ],
      })
    );

    expect(rows.map((row) => row.thematique.label)).toEqual([
      'Eau',
      'Risques naturels',
      'Sécheresse',
      'Inondation',
    ]);
  });

  // Le dernier enfant referme le trait vertical de l'arborescence : sans lui,
  // le trait file jusqu'à la thématique racine suivante.
  it('désigne le dernier enfant de la fratrie', () => {
    const rows = toVulnerabiliteRows(
      vulnerabilite({
        thematiques: [
          risquesNaturels,
          secheresse,
          inondation,
          thematique({ id: 1, code: 'eau', label: 'Eau' }),
        ],
      })
    );

    expect(
      rows.map(({ thematique: t, isDernierEnfant }) => [
        t.label,
        isDernierEnfant,
      ])
    ).toEqual([
      ['Risques naturels', false],
      ['Sécheresse', false],
      ['Inondation', true],
      ['Eau', false],
    ]);
  });

  it('marque la sous-thématique pour que la cellule se mette en retrait', () => {
    const rows = toVulnerabiliteRows(
      vulnerabilite({ thematiques: [risquesNaturels, secheresse] })
    );

    expect(rows.map((row) => row.isEnfant)).toEqual([false, true]);
  });

  // Le parent reste saisissable : sa ligne n'est pas un en-tête de groupe.
  it('donne sa propre ligne à la thématique parente', () => {
    const rows = toVulnerabiliteRows(
      vulnerabilite({
        thematiques: [risquesNaturels, secheresse],
        lignes: [
          {
            thematiqueId: 10,
            niveauMaintenant: 'fort',
            niveau2050: null,
            niveau2100: null,
            objectifs2050: null,
            objectifs2100: null,
          },
        ],
      })
    );

    expect(rows[0].ligne.niveauMaintenant).toBe('fort');
  });

  it('n’offre pas de sous-thématique sous une thématique réglementaire', () => {
    const [row] = toVulnerabiliteRows(
      vulnerabilite({ thematiques: [risquesNaturels] })
    );

    expect(row.peutRecevoirEnfant).toBe(false);
  });

  it('offre une sous-thématique sous une racine ajoutée par la collectivité', () => {
    const [row] = toVulnerabiliteRows(
      vulnerabilite({
        thematiques: [
          thematique({ id: 20, code: null, label: 'Tourisme', isSocle: false }),
        ],
      })
    );

    expect(row.peutRecevoirEnfant).toBe(true);
  });

  // Un seul sous-niveau : une sous-thématique n'en accueille pas à son tour.
  it('n’offre pas de sous-thématique sous une sous-thématique ajoutée', () => {
    const rows = toVulnerabiliteRows(
      vulnerabilite({
        thematiques: [
          thematique({ id: 20, code: null, label: 'Tourisme', isSocle: false }),
          thematique({
            id: 21,
            code: null,
            label: 'Littoral',
            isSocle: false,
            parentId: 20,
          }),
        ],
      })
    );

    expect(rows[1].peutRecevoirEnfant).toBe(false);
  });

  // Une thématique dont la parente n'est pas servie ne doit pas disparaître.
  it('remonte à la racine la sous-thématique dont la parente manque', () => {
    const rows = toVulnerabiliteRows(
      vulnerabilite({ thematiques: [secheresse] })
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].isEnfant).toBe(false);
  });
});

describe('repli d’une grappe', () => {
  const risquesNaturels = thematique({
    id: 10,
    code: 'risques_naturels',
    label: 'Risques naturels',
  });
  const secheresse = thematique({
    id: 11,
    code: 'risque_secheresse',
    label: 'Sécheresse',
    parentId: 10,
  });
  const eau = thematique({ id: 1, code: 'eau', label: 'Eau' });

  it('compte la fratrie sur la thématique parente', () => {
    const [parente, enfant] = toVulnerabiliteRows(
      vulnerabilite({ thematiques: [risquesNaturels, secheresse] })
    );

    expect(parente.nombreEnfants).toBe(1);
    expect(enfant.nombreEnfants).toBe(0);
  });

  it('retire les sous-thématiques d’une parente repliée', () => {
    const rows = toVulnerabiliteRows(
      vulnerabilite({ thematiques: [risquesNaturels, secheresse, eau] }),
      new Set([10])
    );

    expect(rows.map((row) => row.thematique.label)).toEqual([
      'Risques naturels',
      'Eau',
    ]);
  });

  it('marque la parente repliée pour que le chevron suive', () => {
    const [parente] = toVulnerabiliteRows(
      vulnerabilite({ thematiques: [risquesNaturels, secheresse] }),
      new Set([10])
    );

    expect(parente.isReplie).toBe(true);
  });

  it('déplie par défaut : rien n’est masqué sans consigne', () => {
    const rows = toVulnerabiliteRows(
      vulnerabilite({ thematiques: [risquesNaturels, secheresse] })
    );

    expect(rows).toHaveLength(2);
    expect(rows[0].isReplie).toBe(false);
  });
});
