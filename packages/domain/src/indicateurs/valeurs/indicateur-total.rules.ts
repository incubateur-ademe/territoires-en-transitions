import { sumRoundedTo } from '../../utils/number.utils';

export type SousIndicateurValeur = Readonly<{
  valeur: number | null;
  confidentiel: boolean;
}>;

export type IndicateurTotalReader = 'member' | 'visitor';

export type IndicateurTotal =
  | Readonly<{ status: 'not-cumulative' }>
  | Readonly<{ status: 'no-sous-indicateur' }>
  | Readonly<{ status: 'hidden' }>
  | Readonly<{
      status: 'incomplete';
      filledCount: number;
      expectedCount: number;
    }>
  | Readonly<{ status: 'complete'; valeur: number }>;

export const calculateIndicateurTotal = ({
  cumul,
  reader,
  precision,
  sousIndicateurs,
}: {
  cumul: boolean;
  reader: IndicateurTotalReader;
  precision: number;
  sousIndicateurs: readonly SousIndicateurValeur[];
}): IndicateurTotal => {
  if (!cumul) {
    return { status: 'not-cumulative' };
  }
  if (sousIndicateurs.length === 0) {
    return { status: 'no-sous-indicateur' };
  }
  if (
    reader === 'visitor' &&
    sousIndicateurs.some(({ confidentiel }) => confidentiel)
  ) {
    return { status: 'hidden' };
  }

  const valeurs = sousIndicateurs.flatMap(({ valeur }) =>
    valeur === null ? [] : [valeur]
  );
  if (valeurs.length < sousIndicateurs.length) {
    return {
      status: 'incomplete',
      filledCount: valeurs.length,
      expectedCount: sousIndicateurs.length,
    };
  }
  return { status: 'complete', valeur: sumRoundedTo(valeurs, precision) };
};
