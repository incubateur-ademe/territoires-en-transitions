import { appLabels } from '@/app/labels/catalog';
import ChartLegend, { ChartLegendItem } from '@/app/ui/charts/ChartLegend';
import { preset } from '@tet/ui';
import { JSX } from 'react';

const { colors } = preset.theme.extend;

const LEGEND_ITEMS: ChartLegendItem[] = [
  { name: appLabels.pertinenceLabel('non_pertinent'), color: colors.grey[4] },
  { name: appLabels.pertinenceLabel('pertinent'), color: colors.grey[7] },
  { name: appLabels.legendePreselection, color: colors.primary[9] },
];

export const LeviersMatrixLegend = (): JSX.Element => (
  <ChartLegend
    isOpen
    items={LEGEND_ITEMS}
    size="sm"
    className="justify-start text-xs"
  />
);
