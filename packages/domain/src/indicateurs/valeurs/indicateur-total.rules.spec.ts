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

const base = { cumul: true, reader: 'member', precision: 2 } as const;

describe('calculateIndicateurTotal', () => {
  it('ne calcule aucun total quand le cumul est décoché', () => {
    expect(
      calculateIndicateurTotal({
        ...base,
        cumul: false,
        sousIndicateurs: [toSousIndicateur(1), toSousIndicateur(2)],
      })
    ).toEqual({ status: 'not-cumulative' });
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
  });

  const member = {
    reader: 'member',
    precision: 2,
    parentConfidentiel: false,
  } as const;
  const visitor = {
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

  it('masque au visiteur le résultat de la date du dernier résultat d’un enfant confidentiel sans masquer l’objectif', () => {
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

  it('montre au membre le résultat de la date la plus récente malgré un enfant confidentiel', () => {
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

  it('masque chaque enfant confidentiel à la date de son propre dernier résultat', () => {
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

  it('ne masque que la date du dernier résultat non nul d’un enfant confidentiel', () => {
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

  it('masque la date du dernier résultat de l’enfant confidentiel et signale l’enfant manquant à la date suivante', () => {
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
});
