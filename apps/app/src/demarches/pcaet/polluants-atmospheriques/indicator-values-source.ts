import { ListIndicateurValeurOuput } from '@/app/indicateurs/valeurs/use-list-indicateur-valeurs';
import { IndicateurSourceEnum } from '@tet/domain/indicateurs';
import { groupBy } from 'es-toolkit';
import {
  IndicatorValues,
  sectorPollutantIdentifier,
  YearValue,
  yearFromDateValue,
} from './grid-model';
import {
  AIR_POLLUTANTS,
  AIR_SECTORS,
  HORIZON_YEARS,
  OPEN_DATA_SOURCE,
} from './polluants-atmospheriques.constants';

export const indicatorsFromQuery = (
  data: ListIndicateurValeurOuput | undefined
): IndicatorValues[] =>
  (data?.indicateurs ?? []).flatMap((indicateur) => {
    const identifier = indicateur.definition.identifiantReferentiel;
    if (identifier === null) {
      return [];
    }
    const toYearValues = (source: IndicateurSourceEnum): YearValue[] =>
      (indicateur.sources[source]?.valeurs ?? []).map((valeur) => ({
        year: yearFromDateValue(valeur.dateValeur),
        value: valeur.resultat ?? null,
      }));
    return [
      {
        identifier,
        indicateurId: indicateur.definition.id,
        collectivite: toYearValues(IndicateurSourceEnum.COLLECTIVITE),
        openData: toYearValues(OPEN_DATA_SOURCE),
      },
    ];
  });

export const demoIndicators = ({
  referenceYear,
}: {
  referenceYear: number;
}): IndicatorValues[] => {
  const years = [referenceYear, ...HORIZON_YEARS];
  return AIR_SECTORS.flatMap((sector, sectorIndex) =>
    AIR_POLLUTANTS.map((pollutant, pollutantIndex) => {
      const base = 200 + pollutantIndex * 50 + sectorIndex * 20;
      return {
        identifier: sectorPollutantIdentifier(pollutant.letter, sector.letter),
        indicateurId: 900000 + sectorIndex * 100 + pollutantIndex,
        collectivite: [],
        openData: years.map((year) => ({
          year,
          value: year === referenceYear ? base : Math.round(base * 0.7),
        })),
      };
    })
  );
};

type IndicatorValueUpdate = {
  indicateurId: number;
  year: number;
  value: number | null;
};

const mergeYearValues = (
  current: YearValue[],
  updates: IndicatorValueUpdate[]
): YearValue[] => {
  const updatedYears = new Set(updates.map((update) => update.year));
  const untouched = current.filter((entry) => !updatedYears.has(entry.year));
  const next = updates.map((update) => ({
    year: update.year,
    value: update.value,
  }));
  return [...untouched, ...next];
};

export const applyValuesToIndicators = (
  indicators: IndicatorValues[],
  updates: IndicatorValueUpdate[]
): IndicatorValues[] => {
  const updatesByIndicator = groupBy(updates, (update) => update.indicateurId);
  return indicators.map((indicator) => {
    const indicatorUpdates = updatesByIndicator[indicator.indicateurId] ?? [];
    if (indicatorUpdates.length === 0) {
      return indicator;
    }
    return {
      ...indicator,
      collectivite: mergeYearValues(indicator.collectivite, indicatorUpdates),
    };
  });
};
