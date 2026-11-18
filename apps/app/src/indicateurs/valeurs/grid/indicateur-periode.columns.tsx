import {
  IndicateurPeriodiciteEnum,
  IndicateurPeriodes,
} from '@tet/domain/indicateurs';
import { valueFieldsForPeriode } from './cell-editability';
import { IndicateurYearHeaderCell } from './indicateur-year.header-cell';
import type { IndicateurPeriodeColumn } from './types';

export const buildIndicateurPeriodeColumns = ({
  years,
  referenceYear,
  currentYear,
  onReferenceYearChange,
  isReadonly,
}: {
  years: readonly number[];
  referenceYear: number | null;
  currentYear: number;
  onReferenceYearChange?: (year: number) => void;
  isReadonly: boolean;
}): IndicateurPeriodeColumn[] => {
  const currentPeriode = IndicateurPeriodes.parse(
    IndicateurPeriodiciteEnum.ANNUELLE,
    String(currentYear)
  );
  const displayYears = [
    referenceYear,
    ...years.filter((year) => year !== referenceYear),
  ];
  return displayYears.map((year) => {
    const periode =
      year === null
        ? null
        : IndicateurPeriodes.parse(
            IndicateurPeriodiciteEnum.ANNUELLE,
            String(year)
          );
    const isReference = year === referenceYear;
    return {
      periode,
      valeurTypes:
        periode === null
          ? ['resultat']
          : valueFieldsForPeriode(periode, currentPeriode),
      renderHeader: (colSpan) => (
        <IndicateurYearHeaderCell
          year={year}
          colSpan={colSpan}
          isReference={isReference}
          displayedYears={displayYears.filter((year) => year !== null)}
          onReferenceYearChange={
            isReference && !isReadonly ? onReferenceYearChange : undefined
          }
        />
      ),
    };
  });
};
