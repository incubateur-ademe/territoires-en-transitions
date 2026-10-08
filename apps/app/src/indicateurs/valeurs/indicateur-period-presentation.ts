import type { TimeAxisOptions } from '@/app/ui/charts/echarts/utils';
import { appLabels } from '@/app/labels/catalog';
import {
  formatIndicateurPeriod,
  getIndicateurPeriodPresentation as getSharedIndicateurPeriodPresentation,
  IndicateurPeriodicite,
  IndicateurPeriodiciteEnum,
  IndicateurPeriods,
  indicateurPeriodiciteValues,
  type LocalCalendarDate,
} from '@tet/domain/indicateurs';

type PeriodEditorPresentation = {
  fieldLabel: string;
  inputType: 'text' | 'month';
  inputMode?: 'numeric';
  addLabel: string;
  validateAndAddLabel: string;
  subdivisionOptions: { value: string; label: string }[];
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
  [IndicateurPeriodiciteEnum.ANNUELLE]: {
    label: appLabels.periodiciteAnnuelle,
    editor: {
      fieldLabel: appLabels.champAnnee,
      inputType: 'text',
      inputMode: 'numeric',
      addLabel: appLabels.ajouterAnnee,
      validateAndAddLabel: appLabels.validerAjouterAnnee,
      subdivisionOptions: [],
    },
  },
  [IndicateurPeriodiciteEnum.SEMESTRIELLE]: {
    label: appLabels.periodiciteSemestrielle,
    editor: {
      fieldLabel: appLabels.champSemestre,
      inputType: 'text',
      addLabel: appLabels.ajouterSemestre,
      validateAndAddLabel: appLabels.validerAjouterSemestre,
      subdivisionOptions: Array.from({ length: 2 }, (_, index) => ({
        value: String(index + 1),
        label: String(index + 1),
      })),
    },
  },
  [IndicateurPeriodiciteEnum.TRIMESTRIELLE]: {
    label: appLabels.periodiciteTrimestrielle,
    editor: {
      fieldLabel: appLabels.champTrimestre,
      inputType: 'text',
      addLabel: appLabels.ajouterTrimestre,
      validateAndAddLabel: appLabels.validerAjouterTrimestre,
      subdivisionOptions: Array.from({ length: 4 }, (_, index) => ({
        value: String(index + 1),
        label: String(index + 1),
      })),
    },
  },
  [IndicateurPeriodiciteEnum.MENSUELLE]: {
    label: appLabels.periodiciteMensuelle,
    editor: {
      fieldLabel: appLabels.champMois,
      inputType: 'month',
      addLabel: appLabels.ajouterMois,
      validateAndAddLabel: appLabels.validerAjouterMois,
      subdivisionOptions: Array.from({ length: 12 }, (_, index) => ({
        value: String(index + 1),
        label: new Intl.DateTimeFormat('fr', {
          month: 'long',
          timeZone: 'UTC',
        }).format(Date.UTC(2000, index, 1)),
      })),
    },
  },
} satisfies Record<IndicateurPeriodicite, IndicateurPeriodPresentation>;

export const INDICATEUR_PERIODICITE_OPTIONS = indicateurPeriodiciteValues.map(
  (periodicite) => ({
    value: periodicite,
    label: PERIOD_PRESENTATIONS[periodicite].label,
  })
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
  periodicite: IndicateurPeriodicite
): TimeAxisOptions => {
  const presentation = getSharedIndicateurPeriodPresentation(periodicite);
  return {
    ...presentation.chartTimeAxis,
    formatter: (value) =>
      formatIndicateurPeriod(
        IndicateurPeriods.current(periodicite, utcCalendarDate(value))
      ),
    axisPointerFormatter: (value) =>
      formatIndicateurPeriod(
        IndicateurPeriods.current(periodicite, utcCalendarDate(value))
      ),
  };
};

export const getIndicateurPeriodiciteTooltip = (
  periodicite: IndicateurPeriodicite,
  participationScore: boolean
): string =>
  participationScore && periodicite === 'annuelle'
    ? appLabels.indicateurPeriodiciteScoreTooltip
    : appLabels.indicateurPeriodiciteTooltip(
        getIndicateurPeriodPresentation(periodicite).label
      );
