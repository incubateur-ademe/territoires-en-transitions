import { IndicateurPeriods } from '@tet/domain/indicateurs';
import { prepareData } from './prepare-data';
import fixtureJson from './test/fixture.json';

type IndicateurSources = NonNullable<Parameters<typeof prepareData>[0]>;
type AdditionalSource = NonNullable<Parameters<typeof prepareData>[3]>[number];

// La fixture JSON ne porte qu'un sous-ensemble des champs du type source.
const fixture = fixtureJson as unknown as { indicateurs: IndicateurSources[] };

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
          periode: IndicateurPeriods.parse('annuelle', '2020'),
          periodeLabel: '2020',
          dateValeurISO: '2020-01-01T00:00:00.000Z',
          valeur: 21,
          commentaire: undefined,
        },
        {
          id: 2,
          calculAuto: false,
          periode: IndicateurPeriods.parse('annuelle', '2021'),
          periodeLabel: '2021',
          dateValeurISO: '2021-01-01T00:00:00.000Z',
          valeur: 13,
          commentaire: 'commentaire objectif 2021',
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
            periode: IndicateurPeriods.parse('annuelle', '2020'),
            periodeLabel: '2020',
            dateValeurISO: '2020-01-01T00:00:00.000Z',
            valeur: 19,
            commentaire: undefined,
          },
          {
            id: 6,
            calculAuto: false,
            periode: IndicateurPeriods.parse('annuelle', '2021'),
            periodeLabel: '2021',
            dateValeurISO: '2021-01-01T00:00:00.000Z',
            valeur: 10,
            commentaire: undefined,
          },
        ],
      },
    ]);
    expect(objectifs.periodes).toEqual([
      IndicateurPeriods.parse('annuelle', '2020'),
      IndicateurPeriods.parse('annuelle', '2021'),
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
          periode: IndicateurPeriods.parse('annuelle', '2020'),
          periodeLabel: '2020',
          dateValeurISO: '2020-01-01T00:00:00.000Z',
          valeur: 20,
          commentaire: 'commentaire résultat 2020',
        },
        {
          id: 2,
          calculAuto: false,
          periode: IndicateurPeriods.parse('annuelle', '2021'),
          periodeLabel: '2021',
          dateValeurISO: '2021-01-01T00:00:00.000Z',
          valeur: 12,
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
            periode: IndicateurPeriods.parse('annuelle', '2020'),
            periodeLabel: '2020',
            dateValeurISO: '2020-01-01T00:00:00.000Z',
            valeur: 20.1,
          },
          {
            id: 4,
            calculAuto: false,
            periode: IndicateurPeriods.parse('annuelle', '2022'),
            periodeLabel: '2022',
            dateValeurISO: '2022-01-01T00:00:00.000Z',
            valeur: 12.2,
          },
        ],
      },
    ]);
    expect(resultats.periodes).toEqual([
      IndicateurPeriods.parse('annuelle', '2020'),
      IndicateurPeriods.parse('annuelle', '2021'),
      IndicateurPeriods.parse('annuelle', '2022'),
    ]);
  });

  test('Extrait la dernière année pour laquelle le résultat peut être en mode privé', () => {
    const resultats = prepareData(fixture.indicateurs[0], 'resultat', false);
    expect(resultats.dernierePeriodeModePrive).toEqual(
      IndicateurPeriods.parse('annuelle', '2021')
    );
    const objectifs = prepareData(fixture.indicateurs[0], 'objectif', false);
    expect(objectifs.dernierePeriodeModePrive).toBeUndefined();
  });

  test('Extrait les lignes existantes des données collectivité', () => {
    const objectifs = prepareData(fixture.indicateurs[0], 'objectif', false);
    const resultats = prepareData(fixture.indicateurs[0], 'resultat', false);
    expect(objectifs.valeursExistantes).toEqual(resultats.valeursExistantes);
    expect(objectifs.valeursExistantes).toEqual([
      {
        periode: IndicateurPeriods.parse('annuelle', '2020'),
        periodeLabel: '2020',
        collectiviteId: 1,
        periodicite: 'annuelle',
        dateValeur: '2020-01-01',
        id: 1,
        objectif: 21,
        resultat: 20,
        resultatCommentaire: 'commentaire résultat 2020',
      },
      {
        periode: IndicateurPeriods.parse('annuelle', '2021'),
        periodeLabel: '2021',
        collectiviteId: 1,
        periodicite: 'annuelle',
        dateValeur: '2021-01-01',
        id: 2,
        objectif: 13,
        objectifCommentaire: 'commentaire objectif 2021',
        resultat: 12,
      },
    ]);
  });

  test('conserve deux mois de la même année et la valeur zéro', () => {
    const monthly = structuredClone(fixture.indicateurs[0]);
    monthly.definition.periodicite = 'mensuelle';
    monthly.sources.collectivite.valeurs = [
      {
        ...monthly.sources.collectivite.valeurs[0],
        periodicite: 'mensuelle',
        dateValeur: '2026-01-01',
        resultat: 0,
      },
      {
        ...monthly.sources.collectivite.valeurs[1],
        periodicite: 'mensuelle',
        dateValeur: '2026-02-01',
        resultat: 2,
      },
    ];

    const resultats = prepareData(monthly, 'resultat', false);

    expect(resultats.donneesCollectivite?.valeurs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          periode: IndicateurPeriods.parse('mensuelle', '2026-01'),
          valeur: 0,
        }),
        expect.objectContaining({
          periode: IndicateurPeriods.parse('mensuelle', '2026-02'),
          valeur: 2,
        }),
      ])
    );
    expect(resultats.dernierePeriodeModePrive).toEqual(
      IndicateurPeriods.parse('mensuelle', '2026-02')
    );
  });

  test('intègre aux périodes une source calculée ajoutée par le graphique', () => {
    const period = IndicateurPeriods.parse('annuelle', '2024');
    const moyenne: AdditionalSource = {
      source: 'moyenne',
      libelle: 'Moyenne des collectivités de même type',
      ordreAffichage: null,
      calculAuto: true,
      metadonnees: [],
      type: 'resultat',
      valeurs: [
        {
          id: -1,
          calculAuto: true,
          periode: period,
          periodeLabel: '2024',
          dateValeurISO: '2024-01-01T00:00:00.000Z',
          valeur: 15,
          commentaire: null,
        },
      ],
    };

    const resultats = prepareData(fixture.indicateurs[0], 'resultat', false, [
      moyenne,
    ]);

    expect(resultats.sources).toContain(moyenne);
    expect(resultats.periodes).toContainEqual(period);
  });
  test('agrège les mois pour la consultation et conserve les commentaires et données de déclaration', () => {
    const monthly = structuredClone(fixture.indicateurs[0]);
    monthly.definition.periodicite = 'mensuelle';
    const valeurs = Array.from({ length: 12 }, (_, index) => ({
      ...monthly.sources.collectivite.valeurs[0],
      id: index + 1,
      periodicite: 'mensuelle' as const,
      dateValeur: `2026-${String(index + 1).padStart(2, '0')}-01`,
      resultat: 10,
      resultatCommentaire: index === 0 ? 'Relevé de janvier' : null,
    }));
    monthly.sources = {
      collectivite: { ...monthly.sources.collectivite, valeurs },
    };
    const displayed = prepareData(monthly, 'resultat', false, [], {
      periodiciteAffichage: 'annuelle',
      aggregationResultat: 'somme',
    });
    expect(displayed.donneesCollectivite?.valeurs).toEqual([
      expect.objectContaining({
        valeur: 120,
        isAggregated: true,
        commentaire: 'janvier 2026 : Relevé de janvier',
        valeursSources: valeurs,
      }),
    ]);
    expect(displayed.valeursExistantes).toHaveLength(12);
    expect(
      displayed.valeursExistantes.every((value) => value.resultat === 10)
    ).toBe(true);
    expect(monthly.sources.collectivite.valeurs).toEqual(valeurs);
  });

  test('sépare la série annuelle de l’agrégation annuelle d’une série mensuelle', () => {
    const mixed = structuredClone(fixture.indicateurs[0]);
    mixed.definition.periodicite = 'mensuelle';
    const original = mixed.sources.collectivite.valeurs[0];
    const monthly = Array.from({ length: 12 }, (_, index) => ({
      ...original,
      periodicite: 'mensuelle' as const,
      dateValeur: `2026-${String(index + 1).padStart(2, '0')}-01`,
      resultat: 10,
    }));
    mixed.sources = {
      collectivite: {
        ...mixed.sources.collectivite,
        valeurs: [
          ...monthly,
          {
            ...original,
            periodicite: 'annuelle',
            dateValeur: '2026-01-01',
            resultat: 900,
          },
        ],
      },
    };
    const displayed = prepareData(mixed, 'resultat', false, [], {
      periodiciteAffichage: 'annuelle',
      aggregationResultat: 'somme',
    });
    expect(displayed.sources).toHaveLength(2);
    expect(
      new Set(displayed.sources.map((source) => source.seriesKey)).size
    ).toBe(2);
    expect(
      displayed.sources.flatMap((source) =>
        source.valeurs.map((value) => value.valeur)
      )
    ).toEqual(expect.arrayContaining([900, 120]));
  });
});
