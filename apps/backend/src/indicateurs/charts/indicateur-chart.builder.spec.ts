import { IndicateurAvecValeursParSource } from '@tet/domain/indicateurs';
import { IndicateurChartBuilder } from './indicateur-chart.builder';
import { selectBestIndicateurSourceValeurType } from './indicateur-chart-segmentation.rules';

const makeIndicateur = (): IndicateurAvecValeursParSource =>
  ({
    definition: {
      id: 1,
      periodicite: 'annuelle',
      titre: 'Émissions annuelles',
      unite: 't',
    },
    sources: {
      collectivite: {
        source: 'collectivite',
        libelle: 'Collectivité',
        metadonnees: [],
        valeurs: [
          {
            dateValeur: '2024-01-01',
            periodicite: 'annuelle',
            resultat: 10,
            objectif: null,
          },
          {
            dateValeur: '2025-01-01',
            periodicite: 'annuelle',
            resultat: null,
            objectif: null,
          },
          {
            dateValeur: '2026-01-01',
            periodicite: 'annuelle',
            resultat: 0,
            objectif: null,
          },
        ],
      },
    },
  } as unknown as IndicateurAvecValeursParSource);

describe('IndicateurChartBuilder — graphiques annuels', () => {
  const builder = new IndicateurChartBuilder();

  it('préserve un trou et une valeur zéro dans la courbe annuelle', () => {
    const chart = builder.build({ indicateurValeurs: makeIndicateur() });
    expect(chart.dataset).toMatchObject([
      {
        source: [
          { dateValeur: '2024-01-01', valeur: 10 },
          { dateValeur: '2025-01-01', valeur: null },
          { dateValeur: '2026-01-01', valeur: 0 },
        ],
      },
    ]);
    expect(chart.series).toMatchObject([{ connectNulls: false }]);
  });

  it('affiche un seuil égal à zéro et les objectifs sur leurs horizons annuels', () => {
    const chart = builder.build({
      indicateurValeurs: makeIndicateur(),
      valeursReference: {
        indicateurId: 1,
        identifiantReferentiel: null,
        cible: null,
        seuil: 0,
        unite: 't',
        libelle: null,
        drom: false,
        objectifs: [
          { dateValeur: '2030-12-31', valeur: 0 },
          { dateValeur: '2025-06-01', valeur: 5 },
          { dateValeur: '2030-01-01', valeur: 2 },
        ],
      },
    });
    expect(chart.dataset).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'seuil',
          source: [expect.objectContaining({ valeur: 0 })],
        }),
        expect.objectContaining({
          id: 'cible-objectifs',
          source: [
            { date: '2025-01-01', valeur: 5 },
            { date: '2030-01-01', valeur: 0 },
          ],
        }),
      ])
    );
  });

  it.each([0, 100, Number.NaN])(
    'conserve des dimensions finies à une largeur de %s',
    (width) => {
      const chart = builder.build({ indicateurValeurs: makeIndicateur() });
      builder.adjustOptionsWithWidth(chart, width);
      expect(chart.grid).toMatchObject({ bottom: 40 });
      expect(chart.title).toMatchObject({
        textStyle: {
          width: Number.isFinite(width) ? Math.max(width - 56, 0) : 0,
        },
      });
    }
  );

  it('sélectionne une source selon les valeurs renseignées et tolère une source absente', () => {
    const indicateur = makeIndicateur();
    indicateur.sources.collectivite.valeurs[0].objectif = 1;
    indicateur.sources.collectivite.valeurs[1].objectif = 2;
    indicateur.sources.collectivite.valeurs[2].objectif = 3;
    expect(selectBestIndicateurSourceValeurType([indicateur])).toEqual({
      source: 'collectivite',
      valeurType: 'objectif',
    });
    expect(() =>
      selectBestIndicateurSourceValeurType([indicateur], 'absente')
    ).not.toThrow();
  });
});
