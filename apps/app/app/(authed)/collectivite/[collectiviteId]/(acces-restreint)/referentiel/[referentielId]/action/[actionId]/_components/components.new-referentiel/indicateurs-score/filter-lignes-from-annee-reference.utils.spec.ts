import { CalculScoreIndicatif } from '@tet/domain/referentiels';
import { describe, expect, it } from 'vitest';
import {
  filterLignesFromAnneeReference,
  getAnneeReference,
} from './filter-lignes-from-annee-reference.utils';

const progressionSnbc: CalculScoreIndicatif = {
  type: 'progression_snbc',
  identifiantReferentiel: 'cae_1.a',
  anneeDepart: 2015,
  objectifSnbcDepart: 100,
  anneeUtilisee: null,
  valeurUtilisee: null,
  objectifSnbc: null,
};

const reduction: CalculScoreIndicatif = {
  type: 'reduction',
  identifiantReferentiel: 'cae_2.a',
  anneeDepart: 2019,
  resultatDepart: 100,
  anneeCible: 2030,
  reductionCible: 0.4,
  anneeUtilisee: null,
  valeurUtilisee: null,
  valeurCible: null,
};

const lignes = [
  { id: 4, annee: 2021 },
  { id: 3, annee: 2016 },
  { id: 2, annee: 2015 },
  { id: 1, annee: 2014 },
];

describe('getAnneeReference', () => {
  it("renvoie l'année de départ pour progression_snbc et reduction", () => {
    expect(getAnneeReference(progressionSnbc)).toBe(2015);
    expect(getAnneeReference(reduction)).toBe(2019);
  });

  it('renvoie null pour les autres types de calcul', () => {
    expect(getAnneeReference(null)).toBeNull();
    expect(getAnneeReference({ type: 'presence_absence' })).toBeNull();
    expect(
      getAnneeReference({
        type: 'valeur_cible_seuil',
        identifiantReferentiel: 'cae_3.a',
        cible: 10,
        seuil: 5,
      })
    ).toBeNull();
  });
});

describe('filterLignesFromAnneeReference', () => {
  it("ne filtre rien sans année de référence", () => {
    expect(filterLignesFromAnneeReference(lignes, null, null)).toEqual(lignes);
  });

  it("écarte les lignes antérieures à l'année de référence et garde celle-ci", () => {
    expect(
      filterLignesFromAnneeReference(lignes, 2015, null).map((l) => l.id)
    ).toEqual([4, 3, 2]);
  });

  it('conserve la ligne sélectionnée même si elle devrait être écartée', () => {
    expect(
      filterLignesFromAnneeReference(lignes, 2015, 1).map((l) => l.id)
    ).toEqual([4, 3, 2, 1]);
  });
});
