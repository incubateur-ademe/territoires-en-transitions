import { IndicateurAvecValeursParSource } from '@tet/domain/indicateurs';
import { DatasetComponentOption } from 'echarts/types/dist/echarts';
import { IndicateurChartBuilder } from './indicateur-chart.builder';

describe('IndicateurChartBuilder', () => {
  const builder = new IndicateurChartBuilder();
  const indicateurValeurs = {
    definition: {
      id: 1,
      titre: 'Consommation électrique',
      unite: 'GWh',
      periodicite: 'mensuelle',
    },
    sources: {},
    totalValeursCount: 0,
    totalFilledValeursCount: 0,
  } as unknown as IndicateurAvecValeursParSource;
  const valeursReference = {
    indicateurId: 1,
    unite: 'GWh',
    identifiantReferentiel: 'cae_1.a',
    libelle: null,
    cible: null,
    seuil: null,
    objectifs: [{ dateValeur: '2030-12-31', valeur: 42 }],
    drom: false,
  };

  test('conserve les douze résultats et objectifs mensuels sans modifier les données', () => {
    const valeurs = Array.from({ length: 12 }, (_, index) => ({
      dateValeur: `2026-${String(index + 1).padStart(2, '0')}-01`,
      periodicite: 'mensuelle',
      resultat: index,
      objectif: index * 2,
    }));
    const monthlyValeurs = {
      ...indicateurValeurs,
      sources: { collectivite: { libelle: 'Collectivité', valeurs } },
    } as unknown as IndicateurAvecValeursParSource;
    const original = structuredClone(monthlyValeurs);
    const chart = builder.build({ indicateurValeurs: monthlyValeurs });
    const datasets = chart.dataset as DatasetComponentOption[];
    expect(datasets[0].source).toEqual(
      valeurs.map(({ dateValeur, resultat }) => ({
        dateValeur,
        valeur: resultat,
      }))
    );
    expect(datasets[1].source).toEqual(
      valeurs.map(({ dateValeur, objectif }) => ({
        dateValeur,
        valeur: objectif,
      }))
    );
    expect(monthlyValeurs).toEqual(original);
  });

  test('conserve une série annuelle externe distincte des observations mensuelles', () => {
    const chart = builder.build({
      indicateurValeurs: {
        ...indicateurValeurs,
        definition: {
          ...indicateurValeurs.definition,
        },
        sources: {
          externe: {
            libelle: 'Source externe',
            valeurs: [
              {
                dateValeur: '2026-01-01',
                periodicite: 'annuelle',
                resultat: 500,
              },
              ...Array.from({ length: 12 }, (_, index) => ({
                dateValeur: `2026-${String(index + 1).padStart(2, '0')}-01`,
                periodicite: 'mensuelle',
                resultat: 10,
              })),
            ],
          },
        },
      } as unknown as IndicateurAvecValeursParSource,
    });
    const datasets = chart.dataset as DatasetComponentOption[];
    expect(datasets).toHaveLength(2);
    expect(new Set(datasets.map(({ id }) => id)).size).toBe(2);
    expect(datasets.map(({ source }) => source)).toEqual(
      expect.arrayContaining([
        [{ dateValeur: '2026-01-01', valeur: 500 }],
        Array.from({ length: 12 }, (_, month) => ({
          dateValeur: `2026-${String(month + 1).padStart(2, '0')}-01`,
          valeur: 10,
        })),
      ])
    );
  });

  test('affiche une source mensuelle externe pour une définition annuelle', () => {
    const chart = builder.build({
      indicateurValeurs: {
        ...indicateurValeurs,
        definition: {
          ...indicateurValeurs.definition,
          periodicite: 'annuelle',
        },
        sources: {
          externe: {
            libelle: 'Source externe',
            valeurs: [
              {
                dateValeur: '2026-02-01',
                periodicite: 'mensuelle',
                resultat: 10,
              },
            ],
          },
        },
      } as unknown as IndicateurAvecValeursParSource,
    });
    expect((chart.dataset as DatasetComponentOption[])[0].source).toEqual([
      { dateValeur: '2026-02-01', valeur: 10 },
    ]);
  });

  test('conserve les observations des segments sans additionner les séries de cadences différentes', () => {
    const child = {
      ...indicateurValeurs,
      definition: {
        ...indicateurValeurs.definition,
        id: 2,
        titre: 'Segment',
      },
      sources: {
        externe: {
          libelle: 'Source externe',
          valeurs: [
            {
              dateValeur: '2026-01-01',
              periodicite: 'annuelle',
              resultat: 500,
            },
            ...Array.from({ length: 12 }, (_, index) => ({
              dateValeur: `2026-${String(index + 1).padStart(2, '0')}-01`,
              periodicite: 'mensuelle',
              resultat: 10,
            })),
          ],
        },
      },
    } as unknown as IndicateurAvecValeursParSource;
    const chart = builder.build({
      indicateurValeurs,
      segmentation: {
        type: 'vecteur',
        source: 'externe',
        valeurType: 'resultat',
        indicateursEnfantValeurs: [child],
      },
    });
    const datasets = chart.dataset as DatasetComponentOption[];
    expect(datasets.map(({ source }) => source)).toEqual(
      expect.arrayContaining([
        [{ dateValeur: '2026-01-01', valeur: 500 }],
        Array.from({ length: 12 }, (_, month) => ({
          dateValeur: `2026-${String(month + 1).padStart(2, '0')}-01`,
          valeur: 10,
        })),
      ])
    );
    const series = Array.isArray(chart.series) ? chart.series : [];
    expect(series).toHaveLength(2);
    expect(
      new Set(
        series.map((serie) => ('stack' in serie ? serie.stack : undefined))
      ).size
    ).toBe(2);
    expect(new Set(series.map((serie) => serie.name)).size).toBe(2);
  });

  test('traite un objectif de référence comme un horizon annuel pour un indicateur mensuel', () => {
    const chart = builder.build({ indicateurValeurs, valeursReference });

    expect(chart.dataset).toEqual([
      expect.objectContaining({
        id: 'cible-objectifs',
        name: 'Objectif 2030 : 42 GWh',
        source: [{ date: '2030-01-01', valeur: 42 }],
      }),
    ]);

    const xAxis = Array.isArray(chart.xAxis) ? chart.xAxis[0] : chart.xAxis;
    expect(chart.useUTC).toBe(true);
    const formatter = (
      xAxis?.axisLabel as { formatter?: (value: number) => string } | undefined
    )?.formatter;
    expect(formatter).toBeTypeOf('function');
    expect(formatter?.(Date.UTC(2026, 1, 1))).toBe('février 2026');
  });

  test('aligne les libellés des références avec le graphique frontend', () => {
    const chart = builder.build({
      indicateurValeurs,
      valeursReference: { ...valeursReference, cible: 50, seuil: 0 },
    });
    const datasets = chart.dataset as DatasetComponentOption[];

    expect(datasets.map(({ name }) => name)).toEqual([
      'Valeur cible : 50 GWh',
      'Valeur limite : 0 GWh',
      'Objectif 2030 : 42 GWh',
    ]);
  });

  test('ordonne les objectifs annuels et garde le dernier horizon de chaque année', () => {
    const chart = builder.build({
      indicateurValeurs,
      valeursReference: {
        ...valeursReference,
        cible: 50,
        seuil: 0,
        libelle: 'Trajectoire cible',
        objectifs: [
          { dateValeur: '2050-06-30', valeur: 10 },
          { dateValeur: '2030-01-01', valeur: 41 },
          { dateValeur: '2030-12-31', valeur: 42 },
        ],
      },
    });
    const objectifs = (chart.dataset as DatasetComponentOption[]).find(
      ({ id }) => id === 'cible-objectifs'
    );
    const objectifsSerie = Array.isArray(chart.series)
      ? chart.series.find(({ id }) => id === 'cible-objectifs')
      : undefined;

    expect(objectifs).toMatchObject({
      id: 'cible-objectifs',
      name: 'Trajectoire cible',
      source: [
        { date: '2030-01-01', valeur: 42 },
        { date: '2050-01-01', valeur: 10 },
      ],
    });
    expect(objectifsSerie?.markLine).toBeUndefined();
  });

  test.each([250, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'garde des dimensions finies pour une largeur non exploitable (%s)',
    (width) => {
      const chart = builder.build({
        indicateurValeurs: {
          ...indicateurValeurs,
          sources: {
            collectivite: {
              libelle: 'Collectivité',
              valeurs: [
                {
                  dateValeur: '2026-01-01',
                  periodicite: 'mensuelle',
                  resultat: 1,
                },
              ],
            },
          },
        } as unknown as IndicateurAvecValeursParSource,
      });

      builder.adjustOptionsWithWidth(chart, width);

      const title = Array.isArray(chart.title) ? chart.title[0] : chart.title;
      const grid = Array.isArray(chart.grid) ? chart.grid[0] : chart.grid;
      expect(Number.isFinite(Number(title?.textStyle?.width))).toBe(true);
      expect(Number.isFinite(Number(grid?.bottom))).toBe(true);
      expect(Number(grid?.bottom)).toBeGreaterThanOrEqual(40);
    }
  );
});
