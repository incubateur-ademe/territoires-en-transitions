import { sumRoundedTo } from '../../utils/number.utils';

export type SousIndicateurValeur = Readonly<{
  valeur: number | null;
  confidentiel: boolean;
}>;

export type IndicateurTotalReader = 'member' | 'visitor';

export type IndicateurTotal =
  | Readonly<{ status: 'not-additive' }>
  | Readonly<{ status: 'no-sous-indicateur' }>
  | Readonly<{ status: 'hidden' }>
  | Readonly<{
      status: 'incomplete';
      filledCount: number;
      expectedCount: number;
    }>
  | Readonly<{ status: 'complete'; valeur: number }>;

export const calculateIndicateurTotal = ({
  totalEstCumulDesSousIndicateurs,
  reader,
  precision,
  sousIndicateurs,
}: {
  totalEstCumulDesSousIndicateurs: boolean;
  reader: IndicateurTotalReader;
  precision: number;
  sousIndicateurs: readonly SousIndicateurValeur[];
}): IndicateurTotal => {
  if (!totalEstCumulDesSousIndicateurs) {
    return { status: 'not-additive' };
  }
  if (sousIndicateurs.length === 0) {
    return { status: 'no-sous-indicateur' };
  }
  const isHiddenFromVisitor =
    reader === 'visitor' &&
    sousIndicateurs.some(({ confidentiel }) => confidentiel);
  if (isHiddenFromVisitor) {
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
  totalEstCumulDesSousIndicateurs,
  reader,
  precision,
  series,
}: {
  dateValeur: string;
  totalEstCumulDesSousIndicateurs: boolean;
  reader: IndicateurTotalReader;
  precision: number;
  series: readonly FilledSerie[];
}): IndicateurTotal =>
  calculateIndicateurTotal({
    totalEstCumulDesSousIndicateurs,
    reader,
    precision,
    sousIndicateurs: series.map(({ confidentiel, latestDate, valeurs }) => {
      const valeurAtDate = valeurs.find(
        (datedValeur) => datedValeur.dateValeur === dateValeur
      );
      const isLatestConfidentialValeur =
        confidentiel && valeurAtDate !== undefined && dateValeur === latestDate;
      return {
        valeur: valeurAtDate?.valeur ?? null,
        confidentiel: isLatestConfidentialValeur,
      };
    }),
  });

export const calculateIndicateurTotalsByDate = ({
  totalEstCumulDesSousIndicateurs,
  reader,
  precision,
  parentConfidentiel,
  sousIndicateurs,
}: {
  totalEstCumulDesSousIndicateurs: boolean;
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
    const resultat = isHiddenByConfidentialParent
      ? HIDDEN_TOTAL
      : calculateTotalAtDate({
          dateValeur,
          totalEstCumulDesSousIndicateurs,
          reader,
          precision,
          series: resultatSeries,
        });
    return {
      dateValeur,
      resultat,
      objectif: calculateTotalAtDate({
        dateValeur,
        totalEstCumulDesSousIndicateurs,
        reader,
        precision,
        series: objectifSeries,
      }),
    };
  });
};
