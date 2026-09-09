import { prepareReferenceObjectifsDataset } from './prepare-reference-objectifs-dataset';

describe('prepareReferenceObjectifsDataset', () => {
  test("conserve l'objectif comme horizon annuel pour un indicateur mensuel", () => {
    const objectifs = [{ dateValeur: '2030-12-31', valeur: 42 }];

    expect(
      prepareReferenceObjectifsDataset({
        valeurs: objectifs,
        unite: 'GWh',
        libelle: null,
      })
    ).toMatchObject({
      id: 'cible-objectifs',
      name: 'Objectif 2030 : 42 GWh',
      source: [
        {
          dateValeurISO: '2030-01-01T00:00:00.000Z',
          valeur: 42,
        },
      ],
    });
  });

  test('utilise le libellé commun quand plusieurs horizons sont définis', () => {
    const objectifs = [
      { dateValeur: '2030-06-30', valeur: 42 },
      { dateValeur: '2050-12-31', valeur: 10 },
    ];

    expect(
      prepareReferenceObjectifsDataset({
        valeurs: objectifs,
        unite: 'GWh',
        libelle: 'Trajectoire cible',
      }).name
    ).toBe('Trajectoire cible');
  });

  test('ordonne les horizons et garde la dernière date importée de chaque année', () => {
    const dataset = prepareReferenceObjectifsDataset({
      valeurs: [
        { dateValeur: '2050-12-31', valeur: 10 },
        { dateValeur: '2030-01-01', valeur: 41 },
        { dateValeur: '2030-12-31', valeur: 42 },
      ],
      unite: 'GWh',
      libelle: 'Trajectoire cible',
    });

    expect(dataset.source).toEqual([
      { dateValeurISO: '2030-01-01T00:00:00.000Z', valeur: 42 },
      { dateValeurISO: '2050-01-01T00:00:00.000Z', valeur: 10 },
    ]);
  });
});
