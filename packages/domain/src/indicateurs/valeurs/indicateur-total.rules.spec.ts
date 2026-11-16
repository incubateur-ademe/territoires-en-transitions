import {
  calculateIndicateurTotal,
  calculateIndicateurTotalsByDate,
  type SousIndicateurSerie,
  type SousIndicateurValeur,
} from './indicateur-total.rules';

const toSousIndicateur = (
  valeur: number | null,
  confidentiel = false
): SousIndicateurValeur => ({ valeur, confidentiel });

const base = {
  totalEstCumulDesSousIndicateurs: true,
  reader: 'member',
  precision: 2,
} as const;

describe('calculateIndicateurTotal', () => {
  it('ne calcule aucun total quand le total n’est pas le totalEstCumulDesSousIndicateurs des sous-indicateurs', () => {
    expect(
      calculateIndicateurTotal({
        ...base,
        totalEstCumulDesSousIndicateurs: false,
        sousIndicateurs: [toSousIndicateur(1), toSousIndicateur(2)],
      })
    ).toEqual({ status: 'not-additive' });
  });

  it('ne révèle rien à un visiteur quand le total n’est pas le totalEstCumulDesSousIndicateurs, même avec un sous-indicateur confidentiel et un sous-indicateur non renseigné', () => {
    expect(
      calculateIndicateurTotal({
        ...base,
        reader: 'visitor',
        totalEstCumulDesSousIndicateurs: false,
        sousIndicateurs: [toSousIndicateur(1, true), toSousIndicateur(null)],
      })
    ).toEqual({ status: 'not-additive' });
  });

  it('signale un groupe sans sous-indicateur', () => {
    expect(calculateIndicateurTotal({ ...base, sousIndicateurs: [] })).toEqual({
      status: 'no-sous-indicateur',
    });
  });

  it('somme les sous-indicateurs quand tous sont renseignés', () => {
    expect(
      calculateIndicateurTotal({
        ...base,
        sousIndicateurs: [toSousIndicateur(10), toSousIndicateur(5.5)],
      })
    ).toEqual({ status: 'complete', valeur: 15.5 });
  });

  it('accepte une valeur zéro comme renseignée', () => {
    expect(
      calculateIndicateurTotal({
        ...base,
        sousIndicateurs: [toSousIndicateur(0), toSousIndicateur(4)],
      })
    ).toEqual({ status: 'complete', valeur: 4 });
  });

  it('arrondit à la précision du parent après la somme et non avant', () => {
    expect(
      calculateIndicateurTotal({
        ...base,
        precision: 0,
        sousIndicateurs: [
          toSousIndicateur(0.4),
          toSousIndicateur(0.4),
          toSousIndicateur(0.4),
        ],
      })
    ).toEqual({ status: 'complete', valeur: 1 });
  });

  it('indique 4 sur 6 quand deux sous-indicateurs n’ont pas de valeur', () => {
    expect(
      calculateIndicateurTotal({
        ...base,
        sousIndicateurs: [
          toSousIndicateur(1),
          toSousIndicateur(2),
          toSousIndicateur(3),
          toSousIndicateur(4),
          toSousIndicateur(null),
          toSousIndicateur(null),
        ],
      })
    ).toEqual({ status: 'incomplete', filledCount: 4, expectedCount: 6 });
  });

  it('masque le total à un visiteur quand un sous-indicateur est confidentiel', () => {
    expect(
      calculateIndicateurTotal({
        ...base,
        reader: 'visitor',
        sousIndicateurs: [toSousIndicateur(1), toSousIndicateur(2, true)],
      })
    ).toEqual({ status: 'hidden' });
  });

  it('masque aussi un total incomplet à un visiteur quand un sous-indicateur est confidentiel', () => {
    expect(
      calculateIndicateurTotal({
        ...base,
        reader: 'visitor',
        sousIndicateurs: [toSousIndicateur(null), toSousIndicateur(2, true)],
      })
    ).toEqual({ status: 'hidden' });
  });

  it('montre le total à un membre même avec un sous-indicateur confidentiel', () => {
    expect(
      calculateIndicateurTotal({
        ...base,
        sousIndicateurs: [toSousIndicateur(1), toSousIndicateur(2, true)],
      })
    ).toEqual({ status: 'complete', valeur: 3 });
  });

  it('montre le total à un visiteur quand aucun sous-indicateur n’est confidentiel', () => {
    expect(
      calculateIndicateurTotal({
        ...base,
        reader: 'visitor',
        sousIndicateurs: [toSousIndicateur(1), toSousIndicateur(2)],
      })
    ).toEqual({ status: 'complete', valeur: 3 });
  });
});

describe('calculateIndicateurTotalsByDate', () => {
  type ValeurAtDate = { resultat?: number | null; objectif?: number | null };

  const toSerie = (
    valeurs: Record<string, ValeurAtDate>,
    confidentiel = false
  ): SousIndicateurSerie => ({
    confidentiel,
    valeurs: Object.entries(valeurs).map(
      ([dateValeur, { resultat = null, objectif = null }]) => ({
        dateValeur,
        resultat,
        objectif,
      })
    ),
    sousIndicateurs: [],
  });

  const member = {
    totalEstCumulDesSousIndicateurs: true,
    reader: 'member',
    precision: 2,
    parentConfidentiel: false,
  } as const;
  const visitor = {
    totalEstCumulDesSousIndicateurs: true,
    reader: 'visitor',
    precision: 2,
    parentConfidentiel: false,
  } as const;
  const noneOfTwo = {
    status: 'incomplete',
    filledCount: 0,
    expectedCount: 2,
  } as const;
  const oneOfTwo = {
    status: 'incomplete',
    filledCount: 1,
    expectedCount: 2,
  } as const;

  it('ne renvoie aucun total sans sous-indicateur', () => {
    expect(
      calculateIndicateurTotalsByDate({ ...member, sousIndicateurs: [] })
    ).toEqual([]);
  });

  it('ne calcule aucun total, ni de résultat ni d’objectif, quand le total n’est pas le totalEstCumulDesSousIndicateurs des sous-indicateurs', () => {
    expect(
      calculateIndicateurTotalsByDate({
        ...member,
        totalEstCumulDesSousIndicateurs: false,
        sousIndicateurs: [
          toSerie({ '2022-01-01': { resultat: 10, objectif: 20 } }),
          toSerie({ '2022-01-01': { resultat: 5, objectif: 8 } }),
        ],
      })
    ).toEqual([
      {
        dateValeur: '2022-01-01',
        resultat: { status: 'not-additive' },
        objectif: { status: 'not-additive' },
      },
    ]);
  });

  it('renvoie le statut non additif à chaque date quand le total n’est pas le totalEstCumulDesSousIndicateurs des sous-indicateurs', () => {
    expect(
      calculateIndicateurTotalsByDate({
        ...member,
        totalEstCumulDesSousIndicateurs: false,
        sousIndicateurs: [
          toSerie({
            '2022-01-01': { resultat: 10 },
            '2023-01-01': { objectif: 4 },
          }),
          toSerie({ '2024-01-01': { resultat: 5 } }),
        ],
      })
    ).toEqual(
      ['2022-01-01', '2023-01-01', '2024-01-01'].map((dateValeur) => ({
        dateValeur,
        resultat: { status: 'not-additive' },
        objectif: { status: 'not-additive' },
      }))
    );
  });

  it('masque à un visiteur le résultat de la dernière date d’un parent confidentiel même quand le total n’est pas le totalEstCumulDesSousIndicateurs', () => {
    expect(
      calculateIndicateurTotalsByDate({
        ...visitor,
        totalEstCumulDesSousIndicateurs: false,
        parentConfidentiel: true,
        sousIndicateurs: [
          toSerie({
            '2022-01-01': { resultat: 10 },
            '2023-01-01': { resultat: 12 },
          }),
          toSerie({ '2023-01-01': { resultat: 5 } }, true),
        ],
      })
    ).toEqual([
      {
        dateValeur: '2022-01-01',
        resultat: { status: 'not-additive' },
        objectif: { status: 'not-additive' },
      },
      {
        dateValeur: '2023-01-01',
        resultat: { status: 'hidden' },
        objectif: { status: 'not-additive' },
      },
    ]);
  });

  it('calcule le total des résultats et celui des objectifs pour chaque date triée', () => {
    expect(
      calculateIndicateurTotalsByDate({
        ...member,
        sousIndicateurs: [
          toSerie({
            '2024-01-01': { objectif: 7 },
            '2022-01-01': { resultat: 1, objectif: 5 },
            '2023-01-01': { resultat: 2 },
          }),
          toSerie({
            '2022-01-01': { resultat: 2, objectif: 6 },
          }),
        ],
      })
    ).toEqual([
      {
        dateValeur: '2022-01-01',
        resultat: { status: 'complete', valeur: 3 },
        objectif: { status: 'complete', valeur: 11 },
      },
      {
        dateValeur: '2023-01-01',
        resultat: oneOfTwo,
        objectif: noneOfTwo,
      },
      {
        dateValeur: '2024-01-01',
        resultat: noneOfTwo,
        objectif: oneOfTwo,
      },
    ]);
  });

  it('liste une date qui n’a que des objectifs avec un total de résultats vide', () => {
    expect(
      calculateIndicateurTotalsByDate({
        ...member,
        sousIndicateurs: [
          toSerie({
            '2022-01-01': { resultat: 1 },
            '2030-01-01': { objectif: 10 },
          }),
          toSerie({
            '2022-01-01': { resultat: 2 },
            '2030-01-01': { objectif: 20 },
          }),
        ],
      })
    ).toEqual([
      {
        dateValeur: '2022-01-01',
        resultat: { status: 'complete', valeur: 3 },
        objectif: noneOfTwo,
      },
      {
        dateValeur: '2030-01-01',
        resultat: noneOfTwo,
        objectif: { status: 'complete', valeur: 30 },
      },
    ]);
  });

  it('ignore les valeurs nulles pour décider des dates', () => {
    expect(
      calculateIndicateurTotalsByDate({
        ...member,
        sousIndicateurs: [
          toSerie({ '2022-01-01': { resultat: null, objectif: null } }),
          toSerie({}),
        ],
      })
    ).toEqual([]);
  });

  it('masque au visiteur le résultat de la date du dernier résultat d’un sous-indicateur confidentiel sans masquer l’objectif', () => {
    expect(
      calculateIndicateurTotalsByDate({
        ...visitor,
        sousIndicateurs: [
          toSerie({
            '2022-01-01': { resultat: 1, objectif: 3 },
            '2023-01-01': { resultat: 2, objectif: 4 },
          }),
          toSerie(
            {
              '2022-01-01': { resultat: 10, objectif: 30 },
              '2023-01-01': { resultat: 20, objectif: 40 },
            },
            true
          ),
        ],
      })
    ).toEqual([
      {
        dateValeur: '2022-01-01',
        resultat: { status: 'complete', valeur: 11 },
        objectif: { status: 'complete', valeur: 33 },
      },
      {
        dateValeur: '2023-01-01',
        resultat: { status: 'hidden' },
        objectif: { status: 'complete', valeur: 44 },
      },
    ]);
  });

  it('montre au membre le résultat de la date la plus récente malgré un sous-indicateur confidentiel', () => {
    expect(
      calculateIndicateurTotalsByDate({
        ...member,
        sousIndicateurs: [
          toSerie({ '2023-01-01': { resultat: 2 } }),
          toSerie({ '2023-01-01': { resultat: 20 } }, true),
        ],
      })
    ).toEqual([
      {
        dateValeur: '2023-01-01',
        resultat: { status: 'complete', valeur: 22 },
        objectif: noneOfTwo,
      },
    ]);
  });

  it('masque chaque sous-indicateur confidentiel à la date de son propre dernier résultat', () => {
    expect(
      calculateIndicateurTotalsByDate({
        ...visitor,
        sousIndicateurs: [
          toSerie(
            { '2022-01-01': { resultat: 1 }, '2023-01-01': { resultat: 2 } },
            true
          ),
          toSerie(
            { '2021-01-01': { resultat: 10 }, '2022-01-01': { resultat: 20 } },
            true
          ),
        ],
      })
    ).toEqual([
      { dateValeur: '2021-01-01', resultat: oneOfTwo, objectif: noneOfTwo },
      {
        dateValeur: '2022-01-01',
        resultat: { status: 'hidden' },
        objectif: noneOfTwo,
      },
      {
        dateValeur: '2023-01-01',
        resultat: { status: 'hidden' },
        objectif: noneOfTwo,
      },
    ]);
  });

  it('ne masque que la date du dernier résultat non nul d’un sous-indicateur confidentiel', () => {
    expect(
      calculateIndicateurTotalsByDate({
        ...visitor,
        sousIndicateurs: [
          toSerie({
            '2022-01-01': { resultat: 1 },
            '2023-01-01': { resultat: 2 },
          }),
          toSerie(
            {
              '2022-01-01': { resultat: 10 },
              '2023-01-01': { resultat: null },
            },
            true
          ),
        ],
      })
    ).toEqual([
      {
        dateValeur: '2022-01-01',
        resultat: { status: 'hidden' },
        objectif: noneOfTwo,
      },
      { dateValeur: '2023-01-01', resultat: oneOfTwo, objectif: noneOfTwo },
    ]);
  });

  it('masque la date du dernier résultat du sous-indicateur confidentiel et signale le sous-indicateur manquant à la date suivante', () => {
    expect(
      calculateIndicateurTotalsByDate({
        ...visitor,
        sousIndicateurs: [
          toSerie({ '2022-01-01': { resultat: 1 } }),
          toSerie({ '2021-01-01': { resultat: 10 } }, true),
        ],
      })
    ).toEqual([
      {
        dateValeur: '2021-01-01',
        resultat: { status: 'hidden' },
        objectif: noneOfTwo,
      },
      { dateValeur: '2022-01-01', resultat: oneOfTwo, objectif: noneOfTwo },
    ]);
  });

  it('masque au visiteur le résultat le plus récent d’un parent confidentiel sans toucher aux autres dates ni aux objectifs', () => {
    expect(
      calculateIndicateurTotalsByDate({
        ...visitor,
        parentConfidentiel: true,
        sousIndicateurs: [
          toSerie({
            '2022-01-01': { resultat: 1, objectif: 1 },
            '2023-01-01': { resultat: 2, objectif: 2 },
          }),
          toSerie({
            '2022-01-01': { resultat: 10, objectif: 10 },
            '2023-01-01': { resultat: 20, objectif: 20 },
            '2030-01-01': { objectif: 50 },
          }),
        ],
      })
    ).toEqual([
      {
        dateValeur: '2022-01-01',
        resultat: { status: 'complete', valeur: 11 },
        objectif: { status: 'complete', valeur: 11 },
      },
      {
        dateValeur: '2023-01-01',
        resultat: { status: 'hidden' },
        objectif: { status: 'complete', valeur: 22 },
      },
      {
        dateValeur: '2030-01-01',
        resultat: noneOfTwo,
        objectif: oneOfTwo,
      },
    ]);
  });

  it('masque au visiteur la dernière date avec un résultat d’un sous-indicateur d’un parent confidentiel même quand le total de cette date est incomplet', () => {
    expect(
      calculateIndicateurTotalsByDate({
        ...visitor,
        parentConfidentiel: true,
        sousIndicateurs: [
          toSerie({
            '2022-01-01': { resultat: 1 },
            '2023-01-01': { resultat: 2 },
          }),
          toSerie({ '2022-01-01': { resultat: 10 } }),
        ],
      })
    ).toEqual([
      {
        dateValeur: '2022-01-01',
        resultat: { status: 'complete', valeur: 11 },
        objectif: noneOfTwo,
      },
      {
        dateValeur: '2023-01-01',
        resultat: { status: 'hidden' },
        objectif: noneOfTwo,
      },
    ]);
  });

  it('ne masque que la dernière date avec un résultat d’un parent confidentiel quand plusieurs dates ont un résultat', () => {
    const resultats = calculateIndicateurTotalsByDate({
      ...visitor,
      parentConfidentiel: true,
      sousIndicateurs: [
        toSerie({
          '2021-01-01': { resultat: 1 },
          '2022-01-01': { resultat: 2 },
          '2023-01-01': { resultat: 3 },
        }),
        toSerie({
          '2021-01-01': { resultat: 10 },
          '2022-01-01': { resultat: 20 },
        }),
      ],
    }).map(({ resultat }) => resultat);

    expect(resultats).toEqual([
      { status: 'complete', valeur: 11 },
      { status: 'complete', valeur: 22 },
      { status: 'hidden' },
    ]);
  });

  it('ne rapproche jamais des dates décalées ni des périodicités différentes : le total reste incomplet', () => {
    expect(
      calculateIndicateurTotalsByDate({
        ...member,
        sousIndicateurs: [
          toSerie({ '2022-01-01': { resultat: 1 } }),
          toSerie({ '2022-06-01': { resultat: 2 } }),
        ],
      }).map(({ resultat }) => resultat)
    ).toEqual([oneOfTwo, oneOfTwo]);
  });

  it('montre au membre le total d’un parent confidentiel', () => {
    expect(
      calculateIndicateurTotalsByDate({
        ...member,
        parentConfidentiel: true,
        sousIndicateurs: [toSerie({ '2023-01-01': { resultat: 2 } })],
      })
    ).toEqual([
      {
        dateValeur: '2023-01-01',
        resultat: { status: 'complete', valeur: 2 },
        objectif: { status: 'incomplete', filledCount: 0, expectedCount: 1 },
      },
    ]);
  });

  describe('sous-indicateurs sur plusieurs niveaux', () => {
    const toGroupe = (
      sousIndicateurs: readonly SousIndicateurSerie[],
      confidentiel = false
    ): SousIndicateurSerie => ({ confidentiel, valeurs: [], sousIndicateurs });

    const resultatAt2022 = (valeur: number) =>
      toSerie({ '2022-01-01': { resultat: valeur } });

    it('somme les sous-indicateurs de bas niveau d’un sous-indicateur intermédiaire dans le total du parent', () => {
      expect(
        calculateIndicateurTotalsByDate({
          ...member,
          sousIndicateurs: [
            resultatAt2022(120),
            toGroupe([resultatAt2022(3), resultatAt2022(5)]),
            resultatAt2022(80),
          ],
        })
      ).toEqual([
        {
          dateValeur: '2022-01-01',
          resultat: { status: 'complete', valeur: 208 },
          objectif: {
            status: 'incomplete',
            filledCount: 0,
            expectedCount: 3,
          },
        },
      ]);
    });

    it('compte les sous-indicateurs directs du parent pour signaler un total incomplet', () => {
      expect(
        calculateIndicateurTotalsByDate({
          ...member,
          sousIndicateurs: [
            resultatAt2022(120),
            toGroupe([resultatAt2022(3), resultatAt2022(5)]),
            toSerie({}),
          ],
        })
      ).toEqual([
        {
          dateValeur: '2022-01-01',
          resultat: { status: 'incomplete', filledCount: 2, expectedCount: 3 },
          objectif: { status: 'incomplete', filledCount: 0, expectedCount: 3 },
        },
      ]);
    });

    it('considère un sous-indicateur intermédiaire incomplet tant qu’une de ses sous-indicateurs de bas niveau manque', () => {
      expect(
        calculateIndicateurTotalsByDate({
          ...member,
          sousIndicateurs: [
            resultatAt2022(120),
            toGroupe([resultatAt2022(3), toSerie({})]),
          ],
        })
      ).toEqual([
        {
          dateValeur: '2022-01-01',
          resultat: { status: 'incomplete', filledCount: 1, expectedCount: 2 },
          objectif: { status: 'incomplete', filledCount: 0, expectedCount: 2 },
        },
      ]);
    });

    it('ne perd aucune date des sous-indicateurs profonds', () => {
      expect(
        calculateIndicateurTotalsByDate({
          ...member,
          sousIndicateurs: [
            toGroupe([
              toGroupe([toSerie({ '2024-01-01': { resultat: 1 } })]),
              toSerie({ '2023-01-01': { resultat: 2 } }),
            ]),
          ],
        }).map(({ dateValeur }) => dateValeur)
      ).toEqual(['2023-01-01', '2024-01-01']);
    });

    it('arrondit une seule fois, sur la somme des sous-indicateurs de bas niveau de tous les niveaux', () => {
      expect(
        calculateIndicateurTotalsByDate({
          ...member,
          precision: 0,
          sousIndicateurs: [
            toGroupe([resultatAt2022(0.4), resultatAt2022(0.4)]),
            resultatAt2022(0.6),
          ],
        })[0].resultat
      ).toEqual({ status: 'complete', valeur: 1 });
    });

    it('masque à un visiteur le total de la date du dernier résultat d’un sous-indicateur de bas niveau confidentielle profonde', () => {
      expect(
        calculateIndicateurTotalsByDate({
          ...visitor,
          sousIndicateurs: [
            toGroupe([
              toSerie(
                {
                  '2022-01-01': { resultat: 1 },
                  '2023-01-01': { resultat: 2 },
                },
                true
              ),
              toSerie({
                '2022-01-01': { resultat: 10 },
                '2023-01-01': { resultat: 20 },
              }),
            ]),
          ],
        }).map(({ dateValeur, resultat }) => ({ dateValeur, resultat }))
      ).toEqual([
        {
          dateValeur: '2022-01-01',
          resultat: { status: 'complete', valeur: 11 },
        },
        { dateValeur: '2023-01-01', resultat: { status: 'hidden' } },
      ]);
    });

    it('masque à un visiteur le total de la date la plus récente d’un sous-indicateur intermédiaire confidentiel', () => {
      expect(
        calculateIndicateurTotalsByDate({
          ...visitor,
          sousIndicateurs: [
            resultatAt2022(100),
            toGroupe(
              [
                toSerie({
                  '2022-01-01': { resultat: 1 },
                  '2023-01-01': { resultat: 2 },
                }),
                toSerie({
                  '2022-01-01': { resultat: 10 },
                  '2023-01-01': { resultat: 20 },
                }),
              ],
              true
            ),
          ],
        }).map(({ dateValeur, resultat }) => ({ dateValeur, resultat }))
      ).toEqual([
        {
          dateValeur: '2022-01-01',
          resultat: { status: 'complete', valeur: 111 },
        },
        {
          dateValeur: '2023-01-01',
          resultat: { status: 'hidden' },
        },
      ]);
    });

    it('ne masque jamais l’objectif à un visiteur, même avec un sous-indicateur confidentiel profond', () => {
      expect(
        calculateIndicateurTotalsByDate({
          ...visitor,
          sousIndicateurs: [
            toGroupe([
              toSerie({ '2022-01-01': { resultat: 1, objectif: 5 } }, true),
            ]),
            toSerie({ '2022-01-01': { resultat: 10, objectif: 50 } }),
          ],
        })[0]
      ).toEqual({
        dateValeur: '2022-01-01',
        resultat: { status: 'hidden' },
        objectif: { status: 'complete', valeur: 55 },
      });
    });

    it('ignore les valeurs propres d’un sous-indicateur qui a des sous-indicateurs', () => {
      expect(
        calculateIndicateurTotalsByDate({
          ...member,
          sousIndicateurs: [
            {
              confidentiel: false,
              valeurs: [
                { dateValeur: '2022-01-01', resultat: 999, objectif: null },
              ],
              sousIndicateurs: [resultatAt2022(3), resultatAt2022(5)],
            },
          ],
        })[0].resultat
      ).toEqual({ status: 'complete', valeur: 8 });
    });

    it('montre à un visiteur la date antérieure au dernier résultat d’un sous-indicateur de bas niveau confidentiel et signale l’autre sous-indicateur manquant à la date suivante', () => {
      expect(
        calculateIndicateurTotalsByDate({
          ...visitor,
          sousIndicateurs: [
            toGroupe([
              toSerie(
                {
                  '2022-01-01': { resultat: 1 },
                  '2023-01-01': { resultat: 2 },
                },
                true
              ),
              toSerie({ '2022-01-01': { resultat: 10 } }),
            ]),
          ],
        }).map(({ dateValeur, resultat }) => ({ dateValeur, resultat }))
      ).toEqual([
        {
          dateValeur: '2022-01-01',
          resultat: { status: 'complete', valeur: 11 },
        },
        { dateValeur: '2023-01-01', resultat: { status: 'hidden' } },
      ]);
    });

    it('arrondit la somme exacte de demi-valeurs réparties sur trois niveaux', () => {
      expect(
        calculateIndicateurTotalsByDate({
          ...member,
          precision: 2,
          sousIndicateurs: [
            toGroupe([toGroupe([resultatAt2022(0.1)]), resultatAt2022(0.2)]),
            resultatAt2022(0.005),
          ],
        })[0].resultat
      ).toEqual({ status: 'complete', valeur: 0.31 });
    });

    it('signale incomplet un parent dont un sous-indicateur de bas niveau n’a aucune valeur à aucune date', () => {
      expect(
        calculateIndicateurTotalsByDate({
          ...member,
          sousIndicateurs: [
            resultatAt2022(10),
            toGroupe([resultatAt2022(1), toSerie({})]),
          ],
        })[0].resultat
      ).toEqual({ status: 'incomplete', filledCount: 1, expectedCount: 2 });
    });

    it('masque à un visiteur le total quand un sous-indicateur de bas niveau est confidentiel et qu’un autre sous-indicateur manque', () => {
      expect(
        calculateIndicateurTotalsByDate({
          ...visitor,
          sousIndicateurs: [
            toGroupe([
              toSerie({ '2022-01-01': { resultat: 1 } }, true),
              toSerie({}),
            ]),
            resultatAt2022(10),
          ],
        })[0].resultat
      ).toEqual({ status: 'hidden' });
    });

    it('renvoie le statut non additif à chaque date même avec plusieurs niveaux', () => {
      expect(
        calculateIndicateurTotalsByDate({
          ...member,
          totalEstCumulDesSousIndicateurs: false,
          sousIndicateurs: [
            toGroupe([resultatAt2022(1), resultatAt2022(2)]),
            resultatAt2022(10),
          ],
        })
      ).toEqual([
        {
          dateValeur: '2022-01-01',
          resultat: { status: 'not-additive' },
          objectif: { status: 'not-additive' },
        },
      ]);
    });

    it('montre au membre le total malgré un sous-indicateur confidentiel profond', () => {
      expect(
        calculateIndicateurTotalsByDate({
          ...member,
          sousIndicateurs: [
            toGroupe([toSerie({ '2022-01-01': { resultat: 1 } }, true)]),
            resultatAt2022(10),
          ],
        })[0].resultat
      ).toEqual({ status: 'complete', valeur: 11 });
    });
  });
});
