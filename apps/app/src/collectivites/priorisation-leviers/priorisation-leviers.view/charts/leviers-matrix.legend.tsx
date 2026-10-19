import { appLabels } from '@/app/labels/catalog';
import ChartLegend, { ChartLegendItem } from '@/app/ui/charts/ChartLegend';
import { toToneColor } from '@/app/ui/charts/matrix/matrix.chart';
import { JSX } from 'react';
import { PRESELECTED_TONE, TONE_BY_PERTINENCE } from '../data/to-matrix-points';

const NonPertinentSymbol = (color: string): JSX.Element => (
  <span
    aria-hidden
    className="size-3 rounded-full border-2 border-dashed"
    style={{ borderColor: color }}
  />
);

const LEGEND_ITEMS: ChartLegendItem[] = [
  {
    name: appLabels.pertinenceLabel('non_pertinent'),
    color: toToneColor(TONE_BY_PERTINENCE.non_pertinent),
    symbole: NonPertinentSymbol,
  },
  {
    name: appLabels.pertinenceLabel('pertinent'),
    color: toToneColor(TONE_BY_PERTINENCE.pertinent),
  },
  {
    name: appLabels.legendeActionSauvegardee,
    color: toToneColor(PRESELECTED_TONE),
  },
];

export const LeviersMatrixLegend = (): JSX.Element => (
  <ChartLegend
    isOpen
    items={LEGEND_ITEMS}
    size="sm"
    className="w-full justify-start text-xs"
  />
);
