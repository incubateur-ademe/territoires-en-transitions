import { appLabels } from '@/app/labels/catalog';
import { Caption } from '@/app/ui/charts/matrix/caption';
import type { StatusScale } from '@/app/ui/charts/status-bar/status-bar';
import { StatusBarChart } from '@/app/ui/charts/status-bar/status-bar.chart';
import { LevierId } from '@tet/domain/shared';
import { preset } from '@tet/ui';
import { sumBy } from 'es-toolkit';
import { JSX, useCallback, useMemo } from 'react';
import { toMobilisationLabel } from './mobilisation-level';
import { toImpactPotentielLabel } from './to-impact-potentiel-label';
import { LevierPlace } from './to-matrix-points';
import { toSousLevierBars } from './to-sous-levier-bars';

type SousLeviersChartProps = {
  places: LevierPlace[];
  onLevierSelected: (levierId: LevierId) => void;
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
  const potentielTotal = sumBy(bars, ({ value }) => value);

  const formatValue = useCallback(
    (potentielReduction: number): string =>
      toImpactPotentielLabel({ potentielReduction, potentielTotal }),
    [potentielTotal]
  );

  const selectBar = (barId: string): void => {
    const bar = bars.find(({ id }) => id === barId);
    if (bar) {
      onLevierSelected(bar.levierId);
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
