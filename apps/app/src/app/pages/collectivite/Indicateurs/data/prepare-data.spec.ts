import { prepareData } from './prepare-data';
import fixture from './test/fixture.json';

describe('prepareData', () => {
  test('Extrait les données "objectifs"', () => {
    const objectifs = prepareData(fixture.indicateurs[0], 'objectif', false);
    const expectedDonneesCollectivite = {
      metadonnees: [],
      calculAuto: false,
      source: 'collectivite',
      libelle: '',
      ordreAffichage: -1,
      type: 'objectif',
      valeurs: [
        {
          id: 1,
          calculAuto: false,
          annee: 2020,
          valeur: 21,
          anneeISO: '2020-01-01T00:00:00.000Z',
          commentaire: undefined,
        },
        {
          id: 2,
          calculAuto: false,
          annee: 2021,
          valeur: 13,
          commentaire: 'commentaire objectif 2021',
          anneeISO: '2021-01-01T00:00:00.000Z',
        },
      ],
    };
    expect(objectifs.donneesCollectivite).toEqual(expectedDonneesCollectivite);

    expect(objectifs.sources).toEqual([
      expectedDonneesCollectivite,
      {
        metadonnees: [],
        calculAuto: false,
        source: 'pcaet',
        libelle: 'Territoires & Climat',
        ordreAffichage: 1,
        type: 'objectif',
        valeurs: [
          {
            id: 5,
            calculAuto: false,
            annee: 2020,
            valeur: 19,
            anneeISO: '2020-01-01T00:00:00.000Z',
            commentaire: undefined,
          },
          {
            id: 6,
            calculAuto: false,
            annee: 2021,
            valeur: 10,
            anneeISO: '2021-01-01T00:00:00.000Z',
            commentaire: undefined,
          },
        ],
      },
    ]);
  });

  test('Extrait les données "résultats"', () => {
    const resultats = prepareData(fixture.indicateurs[0], 'resultat', false);

    const expectedDonneesCollectivite = {
      metadonnees: [],
      calculAuto: false,
      source: 'collectivite',
      libelle: '',
      ordreAffichage: -1,
      type: 'resultat',
      valeurs: [
        {
          id: 1,
          calculAuto: false,
          annee: 2020,
          valeur: 20,
          commentaire: 'commentaire résultat 2020',
          anneeISO: '2020-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          calculAuto: false,
          annee: 2021,
          valeur: 12,
          anneeISO: '2021-01-01T00:00:00.000Z',
          commentaire: undefined,
        },
      ],
    };
    expect(resultats.donneesCollectivite).toEqual(expectedDonneesCollectivite);

    expect(resultats.sources).toEqual([
      expectedDonneesCollectivite,
      {
        metadonnees: [],
        calculAuto: false,
        source: 'citepa',
        libelle: 'CITEPA',
        ordreAffichage: 3,
        type: 'resultat',
        valeurs: [
          {
            id: 3,
            calculAuto: false,
            annee: 2020,
            valeur: 20.1,
            anneeISO: '2020-01-01T00:00:00.000Z',
          },
          {
            id: 4,
            calculAuto: false,
            annee: 2022,
            valeur: 12.2,
            anneeISO: '2022-01-01T00:00:00.000Z',
          },
        ],
      },
    ]);
  });

  test('Extrait la dernière année pour laquelle le résultat peut être en mode privé', () => {
    const resultats = prepareData(fixture.indicateurs[0], 'resultat', false);
    expect(resultats.anneeModePrive).toBe(2021);
    const objectifs = prepareData(fixture.indicateurs[0], 'objectif', false);
    expect(objectifs.anneeModePrive).toBeUndefined();
  });

  test('Extrait les lignes existantes des données collectivité', () => {
    const objectifs = prepareData(fixture.indicateurs[0], 'objectif', false);
    const resultats = prepareData(fixture.indicateurs[0], 'resultat', false);
    expect(objectifs.valeursExistantes).toEqual(resultats.valeursExistantes);
    expect(objectifs.valeursExistantes).toEqual([
      {
        annee: 2020,
        collectiviteId: 1,
        dateValeur: '2020-01-01',
        id: 1,
        objectif: 21,
        resultat: 20,
        resultatCommentaire: 'commentaire résultat 2020',
      },
      {
        annee: 2021,
        collectiviteId: 1,
        dateValeur: '2021-01-01',
        id: 2,
        objectif: 13,
        objectifCommentaire: 'commentaire objectif 2021',
        resultat: 12,
      },
    ]);
  });
});
