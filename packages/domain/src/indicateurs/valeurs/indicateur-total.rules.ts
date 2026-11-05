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

export type SousIndicateurSerie = Readonly<{
  confidentiel: boolean;
  valeurs: readonly Readonly<{
    dateValeur: string;
    resultat: number | null;
    objectif: number | null;
  }>[];
}>;

export type IndicateurTotalAtDate = Readonly<{
  dateValeur: string;
  resultat: IndicateurTotal;
  objectif: IndicateurTotal;
}>;

type DatedValeur = Readonly<{ dateValeur: string; valeur: number }>;

type FilledSerie = Readonly<{
  confidentiel: boolean;
  latestDate: string | null;
  valeurs: readonly DatedValeur[];
}>;

const HIDDEN_TOTAL: IndicateurTotal = { status: 'hidden' };

const findLatestDate = (dates: readonly string[]): string | null =>
  dates.reduce<string | null>(
    (latest, date) => (latest === null || date > latest ? date : latest),
    null
  );

const toFilledSerie = ({
  confidentiel,
  valeurs,
}: {
  confidentiel: boolean;
  valeurs: readonly Readonly<{ dateValeur: string; valeur: number | null }>[];
}): FilledSerie => {
  const filledValeurs = valeurs.flatMap(({ dateValeur, valeur }) =>
    valeur === null ? [] : [{ dateValeur, valeur }]
  );
  return {
    confidentiel,
    latestDate: findLatestDate(
      filledValeurs.map(({ dateValeur }) => dateValeur)
    ),
    valeurs: filledValeurs,
  };
};

const listDates = (series: readonly FilledSerie[]): string[] =>
  series.flatMap(({ valeurs }) => valeurs.map(({ dateValeur }) => dateValeur));

const calculateTotalAtDate = ({
  dateValeur,
  reader,
  precision,
  series,
}: {
  dateValeur: string;
  reader: IndicateurTotalReader;
  precision: number;
  series: readonly FilledSerie[];
}): IndicateurTotal =>
  calculateIndicateurTotal({
    cumul: true,
    reader,
    precision,
    sousIndicateurs: series.map(({ confidentiel, latestDate, valeurs }) => {
      const found = valeurs.find((filled) => filled.dateValeur === dateValeur);
      return {
        valeur: found?.valeur ?? null,
        confidentiel:
          confidentiel && found !== undefined && dateValeur === latestDate,
      };
    }),
  });

export const calculateIndicateurTotalsByDate = ({
  reader,
  precision,
  parentConfidentiel,
  sousIndicateurs,
}: {
  reader: IndicateurTotalReader;
  precision: number;
  parentConfidentiel: boolean;
  sousIndicateurs: readonly SousIndicateurSerie[];
}): readonly IndicateurTotalAtDate[] => {
  const resultatSeries = sousIndicateurs.map(({ confidentiel, valeurs }) =>
    toFilledSerie({
      confidentiel,
      valeurs: valeurs.map(({ dateValeur, resultat }) => ({
        dateValeur,
        valeur: resultat,
      })),
    })
  );
  const objectifSeries = sousIndicateurs.map(({ valeurs }) =>
    toFilledSerie({
      confidentiel: false,
      valeurs: valeurs.map(({ dateValeur, objectif }) => ({
        dateValeur,
        valeur: objectif,
      })),
    })
  );

  const dates = [
    ...new Set([...listDates(resultatSeries), ...listDates(objectifSeries)]),
  ].sort();
  const latestResultatDate = findLatestDate(listDates(resultatSeries));
  const hidesLatestResultat = reader === 'visitor' && parentConfidentiel;

  return dates.map((dateValeur) => {
    const isHiddenByConfidentialParent =
      hidesLatestResultat && dateValeur === latestResultatDate;
    return {
      dateValeur,
      resultat: isHiddenByConfidentialParent
        ? HIDDEN_TOTAL
        : calculateTotalAtDate({
            dateValeur,
            reader,
            precision,
            series: resultatSeries,
          }),
      objectif: calculateTotalAtDate({
        dateValeur,
        reader,
        precision,
        series: objectifSeries,
      }),
    };
  });
};
