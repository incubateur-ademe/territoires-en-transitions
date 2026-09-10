import type { TimeAxisOptions } from '@/app/ui/charts/echarts/utils';
import { appLabels } from '@/app/labels/catalog';
import {
  formatIndicateurPeriod,
  getIndicateurPeriodiciteRollout,
  getIndicateurPeriodPresentation as getSharedIndicateurPeriodPresentation,
  IndicateurPeriodicite,
  IndicateurPeriods,
  indicateurPeriodiciteValues,
  resolveIndicateurDisplayPeriodicite,
  type LocalCalendarDate,
} from '@tet/domain/indicateurs';
import type { FeatureFlagKey } from '@tet/domain/utils';

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
 * Environment-neutral labels and chart intervals come from the shared
 * presentation policy in `@tet/domain`.
 */
const PERIOD_PRESENTATIONS = {
  annuelle: {
    label: appLabels.periodiciteAnnuelle,
    editor: {
      fieldLabel: appLabels.champAnnee,
      inputType: 'text',
      inputMode: 'numeric',
      addLabel: appLabels.ajouterAnnee,
      validateAndAddLabel: appLabels.validerAjouterAnnee,
    },
  },
  mensuelle: {
    label: appLabels.periodiciteMensuelle,
    editor: {
      fieldLabel: appLabels.champMois,
      inputType: 'month',
      addLabel: appLabels.ajouterMois,
      validateAndAddLabel: appLabels.validerAjouterMois,
    },
  },
} satisfies Record<IndicateurPeriodicite, IndicateurPeriodPresentation>;

const INDICATEUR_PERIODICITE_OPTIONS = indicateurPeriodiciteValues.map(
  (periodicite) => ({
    value: periodicite,
    label: PERIOD_PRESENTATIONS[periodicite].label,
    activationFeatureFlag:
      getIndicateurPeriodiciteRollout(periodicite).activationFeatureFlag,
  })
);

export const listAvailableIndicateurPeriodiciteOptions = (
  isFeatureFlagEnabled: (featureFlag: FeatureFlagKey) => boolean
): typeof INDICATEUR_PERIODICITE_OPTIONS =>
  INDICATEUR_PERIODICITE_OPTIONS.filter(
    ({ activationFeatureFlag }) =>
      activationFeatureFlag === null ||
      isFeatureFlagEnabled(activationFeatureFlag)
  );

export const getIndicateurPeriodPresentation = (
  periodicite: IndicateurPeriodicite
): IndicateurPeriodPresentation => PERIOD_PRESENTATIONS[periodicite];

const utcCalendarDate = (value: number): LocalCalendarDate => {
  const date = new Date(value);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
};

export const makeIndicateurPeriodTimeAxis = (
  periodicite: IndicateurPeriodicite,
  periodiciteAffichage?: IndicateurPeriodicite
): TimeAxisOptions => {
  const display = resolveIndicateurDisplayPeriodicite(
    periodicite,
    periodiciteAffichage
  );
  const presentation = getSharedIndicateurPeriodPresentation(display);
  return {
    ...presentation.chartTimeAxis,
    formatter: (value) =>
      formatIndicateurPeriod(
        IndicateurPeriods.current(display, utcCalendarDate(value))
      ),
    axisPointerFormatter: (value) =>
      formatIndicateurPeriod(
        IndicateurPeriods.current(periodicite, utcCalendarDate(value))
      ),
  };
};
