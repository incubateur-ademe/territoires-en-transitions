import { describe, expect, it } from 'vitest';
import {
  generateCellKey,
  toIndicateurId,
  toYear,
} from '../../../../indicateurs/valeurs/grid/types';
import { toGridCells, toGridInput } from './topic-grid.adapter';

const ligne = (
  label: string,
  indicateurId: number | null,
  rows: { label: string; referentielId: string; indicateurId: number | null; requis: boolean }[] = []
) => ({
  label,
  referentielId: `cae_${label}`,
  indicateurId,
  requis: true,
  rows,
});

const feuille = (label: string, indicateurId: number | null) => ({
  label,
  referentielId: `cae_${label}`,
  indicateurId,
  requis: true,
});

const cellule = (
  indicateurId: number,
  year: number,
  valeur: Partial<{ resultat: number | null; objectif: number | null }> = {}
) => ({
  indicateurId,
  year,
  resultat: null,
  objectif: null,
  references: [],
  ...valeur,
});

/**
 * Profil énergie climat : les secteurs du décret, sans décomposition.
 *
 * Comme le serveur, la fixture porte une valeur par croisement ligne × année,
 * y compris vide : c'est lui qui décide des cellules ouvertes à la saisie.
 */
const topicPlat = {
  years: [2021, 2030],
  rows: [ligne('Résidentiel', 11), ligne('Tertiaire', 12)],
  valeurs: [
    cellule(11, 2021, { resultat: 12 }),
    cellule(11, 2030, { objectif: 8 }),
    cellule(12, 2021),
    cellule(12, 2030),
  ],
};

/** Polluants : le total du polluant porte sa valeur, ses secteurs les leurs. */
const topicGroupe = {
  years: [2021],
  rows: [ligne('NOx', 41, [feuille('Résidentiel', 411), feuille('Tertiaire', 412)])],
  valeurs: [cellule(41, 2021), cellule(411, 2021), cellule(412, 2021)],
};

describe('toGridInput', () => {
  it('rend un topic sans décomposition à plat', () => {
    expect(toGridInput(topicPlat)).toEqual([
      { indicateurId: 11, label: 'Résidentiel' },
      { indicateurId: 12, label: 'Tertiaire' },
    ]);
  });

  it('groupe un topic décomposé, le premier niveau portant sa propre ligne', () => {
    expect(toGridInput(topicGroupe)).toEqual({
      NOx: {
        label: 'NOx',
        rows: [
          { indicateurId: 41, label: 'NOx' },
          { indicateurId: 411, label: 'Résidentiel' },
          { indicateurId: 412, label: 'Tertiaire' },
        ],
      },
    });
  });

  it('écarte les lignes sans indicateur : elles ne sont pas saisissables', () => {
    expect(
      toGridInput({ ...topicPlat, rows: [ligne('Orpheline', null)] })
    ).toEqual([]);
  });

  it('n’ajoute pas de ligne pour un regroupement sans indicateur propre', () => {
    const enr = toGridInput({
      years: [2021],
      rows: [ligne('Électrique', null, [feuille('Éolien terrestre', 31)])],
      valeurs: [],
    });

    expect(enr).toEqual({
      Électrique: {
        label: 'Électrique',
        rows: [{ indicateurId: 31, label: 'Éolien terrestre' }],
      },
    });
  });
});

const libelleSource = (sourceId: string) =>
  sourceId === 'rare' ? 'RARE-OREC' : sourceId;

describe('toGridCells', () => {
  it('ouvre une cellule par valeur servie, vide comprise', () => {
    const cells = toGridCells(topicPlat, libelleSource);

    // 2 lignes × 2 années
    expect(cells.size).toBe(4);
    expect(cells.get(generateCellKey(toIndicateurId(12), toYear(2021)))).toEqual({
      resultat: null,
      objectif: null,
      references: [],
    });
  });

  it('verse les valeurs servies sur les bonnes cellules', () => {
    const cells = toGridCells(topicPlat, libelleSource);

    expect(cells.get(generateCellKey(toIndicateurId(11), toYear(2021)))).toEqual({
      resultat: 12,
      objectif: null,
      references: [],
    });
    expect(cells.get(generateCellKey(toIndicateurId(11), toYear(2030)))).toEqual({
      resultat: null,
      objectif: 8,
      references: [],
    });
  });

  it('résout le libellé des sources de référence', () => {
    const cells = toGridCells(
      {
        ...topicPlat,
        valeurs: [
          {
            indicateurId: 11,
            year: 2021,
            resultat: 12,
            objectif: null,
            references: [
              { sourceId: 'rare', millesime: '2024-07-18', resultat: 27.42 },
            ],
          },
        ],
      },
      libelleSource
    );

    expect(
      cells.get(generateCellKey(toIndicateurId(11), toYear(2021)))?.references
    ).toEqual([
      { label: 'RARE-OREC', millesime: '2024-07-18', resultat: 27.42 },
    ]);
  });

  it('ouvre aussi les cellules des deux niveaux d’un topic décomposé', () => {
    const cells = toGridCells(topicGroupe, libelleSource);

    // 3 lignes saisissables (le total et ses deux secteurs) × 1 année
    expect(cells.size).toBe(3);
    expect(
      cells.get(generateCellKey(toIndicateurId(411), toYear(2021)))
    ).toEqual({ resultat: null, objectif: null, references: [] });
  });
});
