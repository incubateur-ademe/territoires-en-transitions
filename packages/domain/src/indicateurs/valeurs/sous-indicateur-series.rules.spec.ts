import { buildSousIndicateurSeries } from './sous-indicateur-series.rules';

const valeursAt2022 = (resultat: number) => [
  { dateValeur: '2022-01-01', resultat, objectif: null },
];

describe('buildSousIndicateurSeries', () => {
  it('rend une liste vide quand la racine n’a aucun sous-indicateur', () => {
    expect(
      buildSousIndicateurSeries({
        indicateurId: 1,
        rattaches: [],
        valeursByIndicateurId: {},
      })
    ).toEqual([]);
  });

  it('rattache chaque sous-indicateur à son parent sur plusieurs niveaux', () => {
    expect(
      buildSousIndicateurSeries({
        indicateurId: 1,
        rattaches: [
          { id: 2, parentId: 1, confidentiel: false },
          { id: 3, parentId: 1, confidentiel: true },
          { id: 4, parentId: 2, confidentiel: false },
        ],
        valeursByIndicateurId: { 3: valeursAt2022(30), 4: valeursAt2022(40) },
      })
    ).toEqual([
      {
        confidentiel: false,
        valeurs: [],
        sousIndicateurs: [
          {
            confidentiel: false,
            valeurs: valeursAt2022(40),
            sousIndicateurs: [],
          },
        ],
      },
      { confidentiel: true, valeurs: valeursAt2022(30), sousIndicateurs: [] },
    ]);
  });

  it('rend le même arbre quand un sous-indicateur précède son parent dans la liste', () => {
    const rattachesInOrder = [
      { id: 2, parentId: 1, confidentiel: false },
      { id: 3, parentId: 2, confidentiel: false },
      { id: 4, parentId: 3, confidentiel: false },
    ];
    const valeursByIndicateurId = { 4: valeursAt2022(40) };

    expect(
      buildSousIndicateurSeries({
        indicateurId: 1,
        rattaches: [...rattachesInOrder].reverse(),
        valeursByIndicateurId,
      })
    ).toEqual(
      buildSousIndicateurSeries({
        indicateurId: 1,
        rattaches: rattachesInOrder,
        valeursByIndicateurId,
      })
    );
  });

  it('descend sur quatre niveaux', () => {
    expect(
      buildSousIndicateurSeries({
        indicateurId: 1,
        rattaches: [
          { id: 2, parentId: 1, confidentiel: false },
          { id: 3, parentId: 2, confidentiel: false },
          { id: 4, parentId: 3, confidentiel: false },
        ],
        valeursByIndicateurId: { 4: valeursAt2022(40) },
      })
    ).toEqual([
      {
        confidentiel: false,
        valeurs: [],
        sousIndicateurs: [
          {
            confidentiel: false,
            valeurs: [],
            sousIndicateurs: [
              {
                confidentiel: false,
                valeurs: valeursAt2022(40),
                sousIndicateurs: [],
              },
            ],
          },
        ],
      },
    ]);
  });

  it('ignore un sous-indicateur dont le parent est absent de la liste', () => {
    expect(
      buildSousIndicateurSeries({
        indicateurId: 1,
        rattaches: [{ id: 5, parentId: 4, confidentiel: false }],
        valeursByIndicateurId: { 5: valeursAt2022(50) },
      })
    ).toEqual([]);
  });

  it('ignore les sous-indicateurs d’une autre racine', () => {
    expect(
      buildSousIndicateurSeries({
        indicateurId: 1,
        rattaches: [
          { id: 2, parentId: 1, confidentiel: false },
          { id: 9, parentId: 8, confidentiel: false },
        ],
        valeursByIndicateurId: { 9: valeursAt2022(90) },
      })
    ).toEqual([{ confidentiel: false, valeurs: [], sousIndicateurs: [] }]);
  });
});
