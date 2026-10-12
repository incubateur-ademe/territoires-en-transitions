import {
  IndicateurPeriodiciteEnum,
  IndicateurPeriods,
} from '@tet/domain/indicateurs';
import { valueFieldsForPeriod } from '../../../../indicateurs/valeurs/grid/cell-editability';
import type { IndicateurPeriodColumn } from '../../../../indicateurs/valeurs/grid/types';
import { DiagnosticIndicateurYearHeaderCell } from './diagnostic-indicateur-year.header-cell';

export const buildDiagnosticIndicateurPeriodColumns = ({
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
}): IndicateurPeriodColumn[] => {
  const currentPeriod = IndicateurPeriods.parse(
    IndicateurPeriodiciteEnum.ANNUELLE,
    String(currentYear)
  );
  const displayYears = [
    referenceYear,
    ...years.filter((year) => year !== referenceYear),
  ];
  return displayYears.map((year) => {
    const period =
      year === null
        ? null
        : IndicateurPeriods.parse(
            IndicateurPeriodiciteEnum.ANNUELLE,
            String(year)
          );
    const isReference = year === referenceYear;
    return {
      period,
      valeurTypes:
        period === null
          ? ['resultat']
          : valueFieldsForPeriod(period, currentPeriod),
      renderHeader: (colSpan) => (
        <DiagnosticIndicateurYearHeaderCell
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
