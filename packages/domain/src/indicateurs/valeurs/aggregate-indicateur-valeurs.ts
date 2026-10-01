import type { IndicateurAggregation } from '../definitions/indicateur-aggregation.schema';
import type { IndicateurPeriodicite } from '../definitions/indicateur-periodicite.schema';
import { isIndicateurDisplayPeriodiciteAllowed } from './indicateur-display-periodicite.rules';
import { IndicateurPeriods, type IndicateurPeriod } from './indicateur-period';

export type IndicateurAggregationSource = Readonly<{
  periodicite: IndicateurPeriodicite;
  dateValeur: string;
  resultat?: number | null;
  objectif?: number | null;
  metadonneeId?: number | null;
}>;

export type IndicateurAggregationOptions = Readonly<{
  periodiciteAffichage: IndicateurPeriodicite;
  aggregationResultat?: IndicateurAggregation | null;
  aggregationObjectif?: IndicateurAggregation | null;
}>;

export type IndicateurDisplayValeur<T extends IndicateurAggregationSource> =
  Readonly<{
    period: IndicateurPeriod;
    periodicite: IndicateurPeriodicite;
    periodiciteSource: IndicateurPeriodicite;
    dateValeur: string;
    resultat: number | null | undefined;
    objectif: number | null | undefined;
    metadonneeId: number | null;
    isAggregated: boolean;
    valeursSources: readonly T[];
  }>;

/**
 * Read-only display projection, called separately for each indicator/source.
 * Cadences and metadata identities remain separate even when their dates overlap.
 * A coarser source is retained at its own cadence, never split into finer values.
 * Aggregation requires an explicit rule and every expected source period with a
 * numeric value. Missing periods/nulls are not zero. Comments and references stay
 * on valeursSources so the presentation can identify every contributing value.
 */
export const aggregateIndicateurValeurs = <
  T extends IndicateurAggregationSource
>(
  valeurs: readonly T[],
  options: IndicateurAggregationOptions
): IndicateurDisplayValeur<T>[] => {
  const groups = new Map<string, { period: IndicateurPeriod; valeurs: T[] }>();
  const display: IndicateurDisplayValeur<T>[] = [];
  for (const valeur of valeurs) {
    const sourcePeriod = IndicateurPeriods.fromDateValeur(
      valeur.periodicite,
      valeur.dateValeur
    );
    if (
      valeur.periodicite === options.periodiciteAffichage ||
      !isIndicateurDisplayPeriodiciteAllowed(
        valeur.periodicite,
        options.periodiciteAffichage
      )
    ) {
      display.push({
        period: sourcePeriod,
        periodicite: valeur.periodicite,
        periodiciteSource: valeur.periodicite,
        dateValeur: valeur.dateValeur,
        resultat: valeur.resultat,
        objectif: valeur.objectif,
        metadonneeId: valeur.metadonneeId ?? null,
        isAggregated: false,
        valeursSources: [valeur],
      });
      continue;
    }
    const period = IndicateurPeriods.containing(
      options.periodiciteAffichage,
      valeur.dateValeur
    );
    const key = `${IndicateurPeriods.key(period)}:${valeur.periodicite}:${
      valeur.metadonneeId ?? 'local'
    }`;
    const group = groups.get(key);
    if (group) group.valeurs.push(valeur);
    else groups.set(key, { period, valeurs: [valeur] });
  }
  for (const { period, valeurs: group } of groups.values()) {
    const sorted = group.toSorted((a, b) =>
      a.dateValeur.localeCompare(b.dateValeur)
    );
    const sourcePeriodicite = sorted[0].periodicite;
    const expectedDates: string[] = [];
    for (
      let current = IndicateurPeriods.containing(
        sourcePeriodicite,
        period.dateDebut
      );
      current.dateDebut < IndicateurPeriods.endExclusive(period);
      current = IndicateurPeriods.next(current)
    ) {
      expectedDates.push(current.dateDebut);
    }
    const complete =
      sorted.length === expectedDates.length &&
      sorted.every((value, index) => value.dateValeur === expectedDates[index]);
    const aggregate = (
      field: 'resultat' | 'objectif',
      rule: IndicateurAggregation | null | undefined
    ): number | null => {
      if (
        !rule ||
        !complete ||
        sorted.some((value) => typeof value[field] !== 'number')
      )
        return null;
      const values = sorted.map((value) => value[field] as number);
      switch (rule) {
        case 'somme':
          return values.reduce((sum, value) => sum + value, 0);
        case 'moyenne':
          return values.reduce((sum, value) => sum + value, 0) / values.length;
        case 'derniere_valeur':
          return values[values.length - 1];
      }
    };
    display.push({
      period,
      periodicite: period.periodicite,
      periodiciteSource: sourcePeriodicite,
      dateValeur: period.dateDebut,
      resultat: aggregate('resultat', options.aggregationResultat),
      objectif: aggregate('objectif', options.aggregationObjectif),
      metadonneeId: sorted[0].metadonneeId ?? null,
      isAggregated: true,
      valeursSources: sorted,
    });
  }
  // Keep entirely absent intermediate buckets visible as gaps, within each
  // source's own observed range. These placeholders are never stored values.
  const aggregatedSeries = new Map<string, IndicateurDisplayValeur<T>[]>();
  for (const value of display) {
    if (!value.isAggregated) continue;
    const key = `${value.periodiciteSource}:${value.metadonneeId ?? 'local'}`;
    const series = aggregatedSeries.get(key);
    if (series) series.push(value);
    else aggregatedSeries.set(key, [value]);
  }
  for (const series of aggregatedSeries.values()) {
    if (series.length < 2) continue;
    const ordered = series.toSorted((left, right) =>
      left.dateValeur.localeCompare(right.dateValeur)
    );
    const first = ordered[0];
    const last = ordered[ordered.length - 1];
    const dates = new Set(ordered.map((value) => value.dateValeur));
    for (
      let period = IndicateurPeriods.next(first.period);
      period.dateDebut < last.dateValeur;
      period = IndicateurPeriods.next(period)
    ) {
      if (dates.has(period.dateDebut)) continue;
      display.push({
        period,
        periodicite: period.periodicite,
        periodiciteSource: first.periodiciteSource,
        dateValeur: period.dateDebut,
        resultat: null,
        objectif: null,
        metadonneeId: first.metadonneeId,
        isAggregated: true,
        valeursSources: [],
      });
    }
  }
  return display.sort((left, right) =>
    IndicateurPeriods.compareTotal(left.period, right.period)
  );
};
