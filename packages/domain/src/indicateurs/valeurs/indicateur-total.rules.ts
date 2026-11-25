import { uniq } from 'es-toolkit';
import { sumRoundedTo } from '../../utils/number.utils';

export type SousIndicateurValeur = Readonly<{
  valeur: number | null;
  confidentiel: boolean;
}>;

export type IndicateurTotalReader = 'member' | 'visitor';

export type IndicateurTotal =
  | Readonly<{ status: 'no-sous-indicateur' }>
  | Readonly<{ status: 'hidden' }>
  | Readonly<{
      status: 'incomplete';
      filledCount: number;
      expectedCount: number;
    }>
  | Readonly<{ status: 'complete'; valeur: number }>;

const listFilledNumbers = (valeurs: readonly (number | null)[]): number[] =>
  valeurs.flatMap((valeur) => (valeur === null ? [] : [valeur]));

export const calculateIndicateurTotal = ({
  reader,
  precision,
  sousIndicateurs,
}: {
  reader: IndicateurTotalReader;
  precision: number;
  sousIndicateurs: readonly SousIndicateurValeur[];
}): IndicateurTotal => {
  if (sousIndicateurs.length === 0) {
    return { status: 'no-sous-indicateur' };
  }
  if (
    reader === 'visitor' &&
    sousIndicateurs.some(({ confidentiel }) => confidentiel)
  ) {
    return { status: 'hidden' };
  }

  const valeurs = listFilledNumbers(
    sousIndicateurs.map(({ valeur }) => valeur)
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
  sousIndicateurs: readonly SousIndicateurSerie[];
}>;

export type IndicateurTotalAtDate = Readonly<{
  dateValeur: string;
  resultat: IndicateurTotal;
  objectif: IndicateurTotal;
}>;

type ValeurKind = 'resultat' | 'objectif';

type FilledSousIndicateur = Readonly<{
  confidentiel: boolean;
  latestDate: string | null;
  ownValeurByDate: ReadonlyMap<string, number>;
  sousIndicateurs: readonly FilledSousIndicateur[];
}>;

type SousIndicateurContribution = Readonly<{
  valeur: number | null;
  hasValeur: boolean;
  hidden: boolean;
}>;

type TotalAtDateParams = Readonly<{
  reader: IndicateurTotalReader;
  precision: number;
  sousIndicateurs: readonly FilledSousIndicateur[];
}>;

const HIDDEN_TOTAL: IndicateurTotal = { status: 'hidden' };

const findLatestDate = (dates: readonly string[]): string | null =>
  [...dates].sort().at(-1) ?? null;

const listDates = (
  sousIndicateurs: readonly FilledSousIndicateur[]
): string[] =>
  sousIndicateurs.flatMap((sousIndicateur) => [
    ...sousIndicateur.ownValeurByDate.keys(),
    ...listDates(sousIndicateur.sousIndicateurs),
  ]);

const listSortedDates = (
  sousIndicateurs: readonly FilledSousIndicateur[]
): string[] => uniq(listDates(sousIndicateurs)).sort();

const listOwnValeurByDate = ({
  serie,
  kind,
}: {
  serie: SousIndicateurSerie;
  kind: ValeurKind;
}): Map<string, number> => {
  if (serie.sousIndicateurs.length > 0) {
    return new Map();
  }
  return new Map(
    serie.valeurs.flatMap(({ dateValeur, ...valeurs }) => {
      const valeur = valeurs[kind];
      return valeur === null ? [] : [[dateValeur, valeur] as const];
    })
  );
};

const toFilledSousIndicateur = ({
  serie,
  kind,
  isParentConfidentiel,
}: {
  serie: SousIndicateurSerie;
  kind: ValeurKind;
  isParentConfidentiel: boolean;
}): FilledSousIndicateur => {
  const isConfidentiel = serie.confidentiel || isParentConfidentiel;
  const sousIndicateurs = serie.sousIndicateurs.map((sousIndicateur) =>
    toFilledSousIndicateur({
      serie: sousIndicateur,
      kind,
      isParentConfidentiel: isConfidentiel,
    })
  );
  const ownValeurByDate = listOwnValeurByDate({ serie, kind });

  return {
    confidentiel: kind === 'resultat' && isConfidentiel,
    latestDate: findLatestDate([
      ...ownValeurByDate.keys(),
      ...listDates(sousIndicateurs),
    ]),
    ownValeurByDate,
    sousIndicateurs,
  };
};

const isLatestConfidentialValeur = ({
  sousIndicateur,
  dateValeur,
  hasValeur,
}: {
  sousIndicateur: FilledSousIndicateur;
  dateValeur: string;
  hasValeur: boolean;
}): boolean =>
  sousIndicateur.confidentiel &&
  hasValeur &&
  dateValeur === sousIndicateur.latestDate;

const calculateOwnContribution = ({
  sousIndicateur,
  dateValeur,
}: {
  sousIndicateur: FilledSousIndicateur;
  dateValeur: string;
}): SousIndicateurContribution => {
  const valeur = sousIndicateur.ownValeurByDate.get(dateValeur);
  const hasValeur = valeur !== undefined;
  return {
    valeur: valeur ?? null,
    hasValeur,
    hidden: isLatestConfidentialValeur({
      sousIndicateur,
      dateValeur,
      hasValeur,
    }),
  };
};

const sumWhenAllFilled = (
  contributions: readonly SousIndicateurContribution[]
): number | null => {
  const valeurs = listFilledNumbers(contributions.map(({ valeur }) => valeur));
  const isFullyFilled = valeurs.length === contributions.length;
  if (!isFullyFilled) {
    return null;
  }
  return valeurs.reduce((total, valeur) => total + valeur, 0);
};

const calculateContribution = ({
  sousIndicateur,
  dateValeur,
}: {
  sousIndicateur: FilledSousIndicateur;
  dateValeur: string;
}): SousIndicateurContribution => {
  const hasSousIndicateurs = sousIndicateur.sousIndicateurs.length > 0;
  if (!hasSousIndicateurs) {
    return calculateOwnContribution({ sousIndicateur, dateValeur });
  }

  const contributions = sousIndicateur.sousIndicateurs.map(
    (sousIndicateurDeBasNiveau) =>
      calculateContribution({
        sousIndicateur: sousIndicateurDeBasNiveau,
        dateValeur,
      })
  );
  const hasValeur = contributions.some(
    (contribution) => contribution.hasValeur
  );
  const isHiddenBySousIndicateur = contributions.some(
    (contribution) => contribution.hidden
  );
  const isHiddenItself = isLatestConfidentialValeur({
    sousIndicateur,
    dateValeur,
    hasValeur,
  });

  return {
    valeur: sumWhenAllFilled(contributions),
    hasValeur,
    hidden: isHiddenBySousIndicateur || isHiddenItself,
  };
};

const calculateTotalAtDate = ({
  dateValeur,
  reader,
  precision,
  sousIndicateurs,
}: TotalAtDateParams & Readonly<{ dateValeur: string }>): IndicateurTotal =>
  calculateIndicateurTotal({
    reader,
    precision,
    sousIndicateurs: sousIndicateurs.map((sousIndicateur) => {
      const { valeur, hidden } = calculateContribution({
        sousIndicateur,
        dateValeur,
      });
      return { valeur, confidentiel: hidden };
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
  const resultatSousIndicateurs = sousIndicateurs.map((serie) =>
    toFilledSousIndicateur({
      serie,
      kind: 'resultat',
      isParentConfidentiel: parentConfidentiel,
    })
  );
  const objectifSousIndicateurs = sousIndicateurs.map((serie) =>
    toFilledSousIndicateur({
      serie,
      kind: 'objectif',
      isParentConfidentiel: parentConfidentiel,
    })
  );

  const dates = listSortedDates([
    ...resultatSousIndicateurs,
    ...objectifSousIndicateurs,
  ]);
  const hidesLatestResultat = reader === 'visitor' && parentConfidentiel;
  const latestResultatDate = findLatestDate(listDates(resultatSousIndicateurs));

  return dates.map((dateValeur) => {
    const isParentResultatHidden =
      hidesLatestResultat && dateValeur === latestResultatDate;
    return {
      dateValeur,
      resultat: isParentResultatHidden
        ? HIDDEN_TOTAL
        : calculateTotalAtDate({
            dateValeur,
            reader,
            precision,
            sousIndicateurs: resultatSousIndicateurs,
          }),
      objectif: calculateTotalAtDate({
        dateValeur,
        reader,
        precision,
        sousIndicateurs: objectifSousIndicateurs,
      }),
    };
  });
};
