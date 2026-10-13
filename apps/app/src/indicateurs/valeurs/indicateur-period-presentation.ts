import type { TimeAxisOptions } from '@/app/ui/charts/echarts/utils';
import { appLabels } from '@/app/labels/catalog';
import {
  getIndicateurPeriodPresentation as getSharedIndicateurPeriodPresentation,
  IndicateurPeriodicite,
  IndicateurPeriodiciteEnum,
  IndicateurPeriodes,
  indicateurPeriodiciteValues,
  type LocalCalendarDate,
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
  [IndicateurPeriodiciteEnum.SEMESTRIELLE]: {
    label: appLabels.periodiciteSemestrielle,
    editor: {
      fieldLabel: appLabels.champSemestre,
      inputType: 'text',
      addLabel: appLabels.ajouterSemestre,
      validateAndAddLabel: appLabels.validerAjouterSemestre,
    },
  },
  [IndicateurPeriodiciteEnum.TRIMESTRIELLE]: {
    label: appLabels.periodiciteTrimestrielle,
    editor: {
      fieldLabel: appLabels.champTrimestre,
      inputType: 'text',
      addLabel: appLabels.ajouterTrimestre,
      validateAndAddLabel: appLabels.validerAjouterTrimestre,
    },
  },
  [IndicateurPeriodiciteEnum.MENSUELLE]: {
    label: appLabels.periodiciteMensuelle,
    editor: {
      fieldLabel: appLabels.champMois,
      inputType: 'month',
      addLabel: appLabels.ajouterMois,
      validateAndAddLabel: appLabels.validerAjouterMois,
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

export const getIndicateurPeriodiciteTooltip = (
  periodicite: IndicateurPeriodicite,
  participationScore: boolean
): string =>
  participationScore && periodicite === 'annuelle'
    ? appLabels.indicateurPeriodiciteScoreTooltip
    : appLabels.indicateurPeriodiciteTooltip(
        getIndicateurPeriodPresentation(periodicite).label
      );
