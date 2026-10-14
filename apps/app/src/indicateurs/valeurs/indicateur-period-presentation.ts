import type { TimeAxisOptions } from '@/app/ui/charts/echarts/utils';
import { appLabels } from '@/app/labels/catalog';
import {
  getIndicateurPeriodPresentation as getSharedIndicateurPeriodPresentation,
  IndicateurPeriodicite,
  IndicateurPeriodiciteEnum,
  IndicateurPeriodes,
  type LocalCalendarDate,
  type SupportedIndicateurPeriodicite,
} from '@tet/domain/indicateurs';

type PeriodEditorPresentation = {
  fieldLabel: string;
  inputType: 'text' | 'month';
  inputMode?: 'numeric';
  addLabel: string;
  validateAndAddLabel: string;
};

type IndicateurPeriodPresentation = {
  label: string;
  editor: PeriodEditorPresentation;
};

/**
 * Unique application extension point for indicator-period controls and copy.
 * Period labels come from IndicateurPeriodes.format and chart intervals from
 * the shared presentation policy in `@tet/domain`.
 */
const PERIOD_PRESENTATIONS = {
  [IndicateurPeriodiciteEnum.ANNUELLE]: {
    label: appLabels.periodiciteAnnuelle,
    editor: {
      fieldLabel: appLabels.champAnnee,
      inputType: 'text',
      inputMode: 'numeric',
      addLabel: appLabels.ajouterAnnee,
      validateAndAddLabel: appLabels.validerAjouterAnnee,
    },
  },
} satisfies Record<
  SupportedIndicateurPeriodicite,
  IndicateurPeriodPresentation
>;

export const INDICATEUR_PERIODICITE_OPTIONS =
  IndicateurPeriodes.supportedPeriodicites.map((periodicite) => ({
    value: periodicite,
    label: PERIOD_PRESENTATIONS[periodicite].label,
  }));

export const getIndicateurPeriodPresentation = (
  periodicite: IndicateurPeriodicite
): IndicateurPeriodPresentation => {
  IndicateurPeriodes.assertAnnual(
    periodicite,
    'Les contrôles annuels des périodes'
  );
  return PERIOD_PRESENTATIONS[periodicite];
};

const utcCalendarDate = (value: number): LocalCalendarDate => {
  const date = new Date(value);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
};

export const makeIndicateurPeriodTimeAxis = (
  periodicite: IndicateurPeriodicite
): TimeAxisOptions => {
  const presentation = getSharedIndicateurPeriodPresentation(periodicite);
  const formatter = (value: number) =>
    IndicateurPeriodes.format(
      IndicateurPeriodes.current(periodicite, utcCalendarDate(value))
    );
  return {
    ...presentation.chartTimeAxis,
    formatter,
    axisPointerFormatter: formatter,
  };
};
