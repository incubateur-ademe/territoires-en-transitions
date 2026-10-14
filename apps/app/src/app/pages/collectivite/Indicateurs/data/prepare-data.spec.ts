import {
  IndicateurPeriodiciteEnum,
  IndicateurPeriodes,
} from '@tet/domain/indicateurs';
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
          periode: IndicateurPeriodes.parse(
            IndicateurPeriodiciteEnum.ANNUELLE,
            '2020'
          ),
          periodeLabel: '2020',
          dateValeurISO: '2020-01-01T00:00:00.000Z',
          valeur: 21,
          commentaire: undefined,
        },
        {
          id: 2,
          calculAuto: false,
          periode: IndicateurPeriodes.parse(
            IndicateurPeriodiciteEnum.ANNUELLE,
            '2021'
          ),
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
            periode: IndicateurPeriodes.parse(
              IndicateurPeriodiciteEnum.ANNUELLE,
              '2020'
            ),
            periodeLabel: '2020',
            dateValeurISO: '2020-01-01T00:00:00.000Z',
            valeur: 19,
            commentaire: undefined,
          },
          {
            id: 6,
            calculAuto: false,
            periode: IndicateurPeriodes.parse(
              IndicateurPeriodiciteEnum.ANNUELLE,
              '2021'
            ),
            periodeLabel: '2021',
            dateValeurISO: '2021-01-01T00:00:00.000Z',
            valeur: 10,
            commentaire: undefined,
          },
        ],
      },
    ]);
    expect(objectifs.periodes).toEqual([
      IndicateurPeriodes.parse(IndicateurPeriodiciteEnum.ANNUELLE, '2020'),
      IndicateurPeriodes.parse(IndicateurPeriodiciteEnum.ANNUELLE, '2021'),
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
          periode: IndicateurPeriodes.parse(
            IndicateurPeriodiciteEnum.ANNUELLE,
            '2020'
          ),
          periodeLabel: '2020',
          dateValeurISO: '2020-01-01T00:00:00.000Z',
          valeur: 20,
          commentaire: 'commentaire résultat 2020',
        },
        {
          id: 2,
          calculAuto: false,
          periode: IndicateurPeriodes.parse(
            IndicateurPeriodiciteEnum.ANNUELLE,
            '2021'
          ),
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
            periode: IndicateurPeriodes.parse(
              IndicateurPeriodiciteEnum.ANNUELLE,
              '2020'
            ),
            periodeLabel: '2020',
            dateValeurISO: '2020-01-01T00:00:00.000Z',
            valeur: 20.1,
          },
          {
            id: 4,
            calculAuto: false,
            periode: IndicateurPeriodes.parse(
              IndicateurPeriodiciteEnum.ANNUELLE,
              '2022'
            ),
            periodeLabel: '2022',
            dateValeurISO: '2022-01-01T00:00:00.000Z',
            valeur: 12.2,
          },
        ],
      },
    ]);
    expect(resultats.periodes).toEqual([
      IndicateurPeriodes.parse(IndicateurPeriodiciteEnum.ANNUELLE, '2020'),
      IndicateurPeriodes.parse(IndicateurPeriodiciteEnum.ANNUELLE, '2021'),
      IndicateurPeriodes.parse(IndicateurPeriodiciteEnum.ANNUELLE, '2022'),
    ]);
  });

  test('Extrait la dernière année pour laquelle le résultat peut être en mode privé', () => {
    const resultats = prepareData(fixture.indicateurs[0], 'resultat', false);
    expect(resultats.dernierePeriodeModePrive).toEqual(
      IndicateurPeriodes.parse(IndicateurPeriodiciteEnum.ANNUELLE, '2021')
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
        periode: IndicateurPeriodes.parse(
          IndicateurPeriodiciteEnum.ANNUELLE,
          '2020'
        ),
        periodeLabel: '2020',
        collectiviteId: 1,
        periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
        dateValeur: '2020-01-01',
        id: 1,
        objectif: 21,
        resultat: 20,
        resultatCommentaire: 'commentaire résultat 2020',
      },
      {
        periode: IndicateurPeriodes.parse(
          IndicateurPeriodiciteEnum.ANNUELLE,
          '2021'
        ),
        periodeLabel: '2021',
        collectiviteId: 1,
        periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
        dateValeur: '2021-01-01',
        id: 2,
        objectif: 13,
        objectifCommentaire: 'commentaire objectif 2021',
        resultat: 12,
      },
    ]);
  });

  test('intègre aux périodes une source calculée ajoutée par le graphique', () => {
    const period = IndicateurPeriodes.parse(
      IndicateurPeriodiciteEnum.ANNUELLE,
      '2024'
    );
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

  test('conserve zéro, les commentaires et les périodes sans valeur annuelle', () => {
    const annual = structuredClone(fixture.indicateurs[0]);
    const valeurs = [
      {
        ...annual.sources.collectivite.valeurs[0],
        resultat: 0,
        resultatCommentaire: 'Aucune émission',
      },
      { ...annual.sources.collectivite.valeurs[1], resultat: null },
    ];
    annual.sources = {
      collectivite: { ...annual.sources.collectivite, valeurs },
    };

    const resultats = prepareData(annual, 'resultat', false);

    expect(resultats.donneesCollectivite?.valeurs).toEqual([
      expect.objectContaining({
        id: valeurs[0].id,
        valeur: 0,
        commentaire: 'Aucune émission',
      }),
      expect.objectContaining({ id: valeurs[1].id, valeur: null }),
    ]);
    expect(resultats.periodes).toEqual([
      IndicateurPeriodes.fromYear(2020),
      IndicateurPeriodes.fromYear(2021),
    ]);
    expect(resultats.dernierePeriodeModePrive).toEqual(
      IndicateurPeriodes.fromYear(2020)
    );
    expect(annual.sources.collectivite.valeurs).toEqual(valeurs);
  });

  test('conserve la lecture annuelle des observations historiques datées en cours d’année', () => {
    const annual = structuredClone(fixture.indicateurs[0]);
    annual.sources.collectivite.valeurs[0].dateValeur = '2020-06-15';

    const resultats = prepareData(annual, 'resultat', false);

    expect(resultats.donneesCollectivite?.valeurs[0]).toMatchObject({
      periode: IndicateurPeriodes.fromYear(2020),
      periodeLabel: '2020',
      dateValeurISO: '2020-01-01T00:00:00.000Z',
    });
    expect(resultats.valeursExistantes[0]).toMatchObject({
      dateValeur: '2020-06-15',
      periode: IndicateurPeriodes.fromYear(2020),
    });
    expect(annual.sources.collectivite.valeurs[0].dateValeur).toBe(
      '2020-06-15'
    );
  });
});
