import { computeProgression } from '@tet/domain/indicateurs';
import {
  computeValeurAttendue,
  LigneValeurProgression,
  pickObjectifSnbc,
  pickValeurDepart,
} from './progression.rules';

const ligne = (
  overrides: Partial<LigneValeurProgression>
): LigneValeurProgression => ({
  metadonneeId: null,
  sourceId: null,
  ordreAffichage: null,
  dateVersion: null,
  dateValeur: '2015-01-01',
  objectif: null,
  resultat: null,
  ...overrides,
});

describe('computeValeurAttendue', () => {
  const base = {
    valeurDepart: 100,
    anneeDepart: 2015,
    anneeCible: 2030,
    reductionCible: 0.4,
  };

  it('interpole linéairement entre le départ et la cible', () => {
    expect(computeValeurAttendue({ ...base, anneeUtilisee: 2025 })).toBeCloseTo(
      100 * (1 - 0.4 * (10 / 15))
    );
  });

  it('reste à la cible après anneeCible', () => {
    expect(computeValeurAttendue({ ...base, anneeUtilisee: 2040 })).toBeCloseTo(
      60
    );
  });

  it('vaut valeurDepart à anneeDepart ou avant', () => {
    expect(computeValeurAttendue({ ...base, anneeUtilisee: 2015 })).toBe(100);
    expect(computeValeurAttendue({ ...base, anneeUtilisee: 2010 })).toBe(100);
  });

  it('renvoie null si anneeCible <= anneeDepart ou valeur manquante', () => {
    expect(
      computeValeurAttendue({ ...base, anneeCible: 2015, anneeUtilisee: 2020 })
    ).toBeNull();
    expect(
      computeValeurAttendue({
        ...base,
        valeurDepart: null,
        anneeUtilisee: 2020,
      })
    ).toBeNull();
    expect(
      computeValeurAttendue({ ...base, anneeUtilisee: undefined })
    ).toBeNull();
  });

  it('nominal : progression ≈ 0.375 pour un résultat de 90', () => {
    const attendue = computeValeurAttendue({ ...base, anneeUtilisee: 2025 });
    expect(computeProgression(100, attendue, 90)).toBeCloseTo(0.375);
  });
});

describe('pickObjectifSnbc', () => {
  it('retient la métadonnée à la dateVersion la plus récente', () => {
    const lignes = [
      ligne({
        metadonneeId: 1,
        sourceId: 'snbc3',
        dateVersion: '2023-01-01',
        objectif: 10,
      }),
      ligne({
        metadonneeId: 2,
        sourceId: 'snbc3',
        dateVersion: '2024-01-01',
        objectif: 20,
      }),
    ];
    expect(pickObjectifSnbc(lignes, 2015)).toBe(20);
  });

  it('ignore les autres sources, les autres années et les objectifs nuls', () => {
    const lignes = [
      ligne({ metadonneeId: 1, sourceId: 'rare', objectif: 5 }),
      // trajectoire SNBC 2 : plus utilisée par le score indicatif
      ligne({ metadonneeId: 3, sourceId: 'snbc', objectif: 6 }),
      ligne({ metadonneeId: 2, sourceId: 'snbc3', objectif: null }),
      ligne({
        metadonneeId: 2,
        sourceId: 'snbc3',
        dateValeur: '2016-01-01',
        objectif: 7,
      }),
    ];
    expect(pickObjectifSnbc(lignes, 2015)).toBeNull();
    expect(pickObjectifSnbc(lignes, 2016)).toBe(7);
  });

  it('accepte une date non 01-01 et prend la dateValeur la plus récente', () => {
    const lignes = [
      ligne({
        metadonneeId: 1,
        sourceId: 'snbc3',
        dateVersion: '2024-01-01',
        dateValeur: '2015-03-01',
        objectif: 1,
      }),
      ligne({
        metadonneeId: 1,
        sourceId: 'snbc3',
        dateVersion: '2024-01-01',
        dateValeur: '2015-06-01',
        objectif: 2,
      }),
    ];
    expect(pickObjectifSnbc(lignes, 2015)).toBe(2);
  });
});

describe('pickValeurDepart', () => {
  it('donne la priorité à la valeur de la collectivité', () => {
    const lignes = [
      ligne({
        metadonneeId: 1,
        sourceId: 'rare',
        ordreAffichage: 1,
        resultat: 50,
      }),
      ligne({ metadonneeId: null, resultat: 100 }),
    ];
    expect(pickValeurDepart(lignes, 2015)).toBe(100);
  });

  it("se replie sur la source à l'ordreAffichage minimal", () => {
    const lignes = [
      ligne({
        metadonneeId: 1,
        sourceId: 'b',
        ordreAffichage: 2,
        resultat: 20,
      }),
      ligne({
        metadonneeId: 2,
        sourceId: 'a',
        ordreAffichage: 1,
        resultat: 10,
      }),
      ligne({
        metadonneeId: 3,
        sourceId: 'c',
        ordreAffichage: null,
        resultat: 30,
      }),
    ];
    expect(pickValeurDepart(lignes, 2015)).toBe(10);
  });

  it("départage l'égalité (ou les ordres nuls) par sourceId", () => {
    const lignes = [
      ligne({
        metadonneeId: 1,
        sourceId: 'z',
        ordreAffichage: null,
        resultat: 1,
      }),
      ligne({
        metadonneeId: 2,
        sourceId: 'a',
        ordreAffichage: null,
        resultat: 2,
      }),
    ];
    expect(pickValeurDepart(lignes, 2015)).toBe(2);
  });

  it('renvoie null sans ligne pour cette année', () => {
    expect(pickValeurDepart([], 2015)).toBeNull();
    expect(
      pickValeurDepart([ligne({ dateValeur: '2016-01-01', resultat: 1 })], 2015)
    ).toBeNull();
  });

  it('ne retient jamais une ligne snbc3 sans resultat', () => {
    const lignes = [
      ligne({
        metadonneeId: 1,
        sourceId: 'snbc3',
        ordreAffichage: 0,
        objectif: 9,
      }),
    ];
    expect(pickValeurDepart(lignes, 2015)).toBeNull();
  });

  it('prend la dateValeur la plus récente en cas de doublon', () => {
    const lignes = [
      ligne({ dateValeur: '2015-02-01', resultat: 1 }),
      ligne({ dateValeur: '2015-09-01', resultat: 2 }),
    ];
    expect(pickValeurDepart(lignes, 2015)).toBe(2);
  });
});
