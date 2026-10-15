import { appLabels } from '@/app/labels/catalog';
import { XAxis, YAxis } from '@/app/ui/charts/matrix/axis';
import { Caption } from '@/app/ui/charts/matrix/caption';
import { DataTable } from '@/app/ui/charts/matrix/data-table';
import { MatrixAnchor, MatrixChart } from '@/app/ui/charts/matrix/matrix.chart';
import { Quadrant } from '@/app/ui/charts/matrix/quadrant';
import { LevierId, levierIdEnumValues } from '@tet/domain/shared';
import { JSX, useMemo } from 'react';
import { z } from 'zod';
import {
  isHighPotentiel,
  LevierPlace,
  LevierTooltip,
  LevierTooltipInput,
  MATRIX_CUT,
  MATRIX_SCALE,
  PreselectedCountByLevier,
  toMatrixPoints,
} from '../data/to-matrix-points';
import { SelectLevier } from '../select-levier';
import { toLevierTooltip } from './to-levier-tooltip';
import { LeviersMatrixLegend } from './leviers-matrix.legend';

type LeviersMatrixChartProps = {
  places: LevierPlace[];
  preselectedCountByLevier: PreselectedCountByLevier;
  selectedLevierId?: LevierId;
  onLevierSelected: SelectLevier;
  anchor?: MatrixAnchor;
};

const levierIdSchema = z.enum(levierIdEnumValues);

const toPotentielLabel = (potentielScore: number): string => {
  if (isHighPotentiel(potentielScore)) {
    return appLabels.axePotentielMax;
  }
  return appLabels.axePotentielMin;
};

const toTooltip = ({ levier }: LevierTooltipInput): LevierTooltip => {
  const { lines, badge, hint } = toLevierTooltip(levier);
  return { description: lines, badge, hint };
};

export const LeviersMatrixChart = ({
  places,
  preselectedCountByLevier,
  selectedLevierId,
  onLevierSelected,
  anchor,
}: LeviersMatrixChartProps): JSX.Element => {
  const points = useMemo(
    () => toMatrixPoints({ places, preselectedCountByLevier, toTooltip }),
    [places, preselectedCountByLevier]
  );

  const selectLevier = (pointId: string): void => {
    const levierId = levierIdSchema.safeParse(pointId);
    if (levierId.success) {
      onLevierSelected(levierId.data);
    }
  };

  return (
    <MatrixChart
      data={points}
      className="h-matrix-chart"
      legend={<LeviersMatrixLegend />}
      selectedPointId={selectedLevierId}
      onPointSelected={selectLevier}
      anchor={anchor}
    >
      <Caption>{appLabels.matriceLegende}</Caption>
      <DataTable
        toggleLabel={appLabels.voirLesDonneesDuGraphique}
        pointHeader={appLabels.levier}
      />
      <XAxis name={appLabels.axeMobilisation} />
      <YAxis name={appLabels.axePotentiel} toValueLabel={toPotentielLabel} />
      <Quadrant
        from={{ x: 0, y: MATRIX_CUT }}
        to={{ x: MATRIX_CUT, y: MATRIX_SCALE }}
        badge={appLabels.quadrantLevierAPrioriser}
        title={appLabels.quadrantFortImpactPeuMobilise}
        tone="error"
      />
      <Quadrant
        from={{ x: MATRIX_CUT, y: MATRIX_CUT }}
        to={{ x: MATRIX_SCALE, y: MATRIX_SCALE }}
        title={appLabels.quadrantFortImpactBienMobilise}
        tone="success"
        titleAnchor="topRight"
      />
      <Quadrant
        from={{ x: 0, y: 0 }}
        to={{ x: MATRIX_CUT, y: MATRIX_CUT }}
        title={appLabels.quadrantFaibleImpactPeuMobilise}
        titleAnchor="bottomLeft"
      />
      <Quadrant
        from={{ x: MATRIX_CUT, y: 0 }}
        to={{ x: MATRIX_SCALE, y: MATRIX_CUT }}
        title={appLabels.quadrantFaibleImpactBienMobilise}
        tone="grey"
        titleAnchor="bottomRight"
      />
    </MatrixChart>
  );
};
