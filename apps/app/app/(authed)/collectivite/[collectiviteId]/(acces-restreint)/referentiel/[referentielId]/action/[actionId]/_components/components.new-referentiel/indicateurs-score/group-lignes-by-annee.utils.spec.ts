import { describe, expect, it } from 'vitest';
import {
  getAnneeOuverteInitiale,
  groupLignesByAnnee,
  LigneValeur,
  partitionGroupesByAnneeReference,
} from './group-lignes-by-annee.utils';

const ligne = (id: number, annee: number): LigneValeur => ({
  id,
  annee,
  valeur: id * 10,
  source: `source ${id}`,
});

const lignes = [
  ligne(5, 2021),
  ligne(4, 2019),
  ligne(3, 2019),
  ligne(2, 2015),
  ligne(1, 2014),
];

const groupes = groupLignesByAnnee(lignes);

describe('groupLignesByAnnee', () => {
  it('renvoie une liste vide sans ligne', () => {
    expect(groupLignesByAnnee([])).toEqual([]);
  });

  it("regroupe les lignes d'une même année en conservant l'ordre reçu", () => {
    expect(
      groupes.map((groupe) => ({
        annee: groupe.annee,
        ids: groupe.lignes.map((l) => l.id),
      }))
    ).toEqual([
      { annee: 2021, ids: [5] },
      { annee: 2019, ids: [4, 3] },
      { annee: 2015, ids: [2] },
      { annee: 2014, ids: [1] },
    ]);
  });
});

describe('partitionGroupesByAnneeReference', () => {
  it('considère tous les groupes comme affichables sans année de référence', () => {
    const [affichables, anterieurs] = partitionGroupesByAnneeReference(
      groupes,
      null
    );
    expect(affichables).toEqual(groupes);
    expect(anterieurs).toEqual([]);
  });

  it("sépare les groupes antérieurs à l'année de référence et garde celle-ci", () => {
    const [affichables, anterieurs] = partitionGroupesByAnneeReference(
      groupes,
      2015
    );
    expect(affichables.map((groupe) => groupe.annee)).toEqual([
      2021, 2019, 2015,
    ]);
    expect(anterieurs.map((groupe) => groupe.annee)).toEqual([2014]);
  });
});

describe('getAnneeOuverteInitiale', () => {
  it("renvoie l'année du groupe multi-sources contenant la sélection", () => {
    expect(getAnneeOuverteInitiale(groupes, 3)).toBe(2019);
  });

  it('renvoie null si la sélection est la seule source de son année', () => {
    expect(getAnneeOuverteInitiale(groupes, 5)).toBeNull();
  });

  it('renvoie null sans sélection', () => {
    expect(getAnneeOuverteInitiale(groupes, null)).toBeNull();
  });
});
