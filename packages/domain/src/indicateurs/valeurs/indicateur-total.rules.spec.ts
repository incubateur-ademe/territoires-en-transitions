import {
  calculateIndicateurTotal,
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
