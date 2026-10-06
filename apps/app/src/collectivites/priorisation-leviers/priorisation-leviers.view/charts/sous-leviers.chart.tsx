import { appLabels } from '@/app/labels/catalog';
import { Caption } from '@/app/ui/charts/matrix/caption';
import type { StatusScale } from '@/app/ui/charts/status-bar/status-bar';
import { StatusBarChart } from '@/app/ui/charts/status-bar/status-bar.chart';
import { preset } from '@tet/ui';
import { sumBy } from 'es-toolkit';
import { JSX, useMemo } from 'react';
import { SelectLevier } from '../levier-panel/use-levier-side-panel';
import { toMobilisationLabel } from './mobilisation-level';
import { LevierPlace } from './to-matrix-points';
import { toSousLevierBars } from './to-sous-levier-bars';
import { useFormatImpactPotentiel } from './use-format-impact-potentiel';

type SousLeviersChartProps = {
  places: LevierPlace[];
  onLevierSelected: SelectLevier;
};

const { colors } = preset.theme.extend;

const STATUS_SCALE: StatusScale<string> = [
  { status: toMobilisationLabel('none'), color: colors.grey[5] },
  { status: toMobilisationLabel('partial'), color: colors.info[2] },
  { status: toMobilisationLabel('good'), color: colors.info[3] },
  { status: toMobilisationLabel('full'), color: colors.info[1] },
];

export const SousLeviersChart = ({
  places,
  onLevierSelected,
}: SousLeviersChartProps): JSX.Element => {
  const bars = useMemo(() => toSousLevierBars(places), [places]);
  const formatValue = useFormatImpactPotentiel(
    sumBy(bars, ({ value }) => value)
  );

  const selectBar = (barId: string): void => {
    const bar = bars.find(({ id }) => id === barId);
    if (bar) {
      onLevierSelected(bar.levierId, bar.categorie);
    }
  };

  return (
    <div className="h-matrix-chart">
      <StatusBarChart
        data={bars}
        statusScale={STATUS_SCALE}
        formatValue={formatValue}
        onBarSelected={selectBar}
      >
        <Caption>{appLabels.sousLeviersLegende}</Caption>
      </StatusBarChart>
    </div>
  );
};
