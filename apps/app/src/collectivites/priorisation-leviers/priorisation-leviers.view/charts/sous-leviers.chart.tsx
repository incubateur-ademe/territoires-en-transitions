import { appLabels } from '@/app/labels/catalog';
import { Caption } from '@/app/ui/charts/matrix/caption';
import type { StatusScale } from '@/app/ui/charts/status-bar/status-bar';
import { StatusBarChart } from '@/app/ui/charts/status-bar/status-bar.chart';
import { StatusBarDataTable } from '@/app/ui/charts/status-bar/status-bar.data-table';
import {
  ActionDeReference,
  CategorieAction,
  LevierId,
} from '@tet/domain/shared';
import { preset } from '@tet/ui';
import { sumBy } from 'es-toolkit';
import { JSX, useMemo } from 'react';
import { LevierPlace } from '../data/to-matrix-points';
import { SelectLevier } from '../select-levier';
import { toMobilisationLabel } from './mobilisation-level';
import {
  toSelectedSousLevierId,
  toSousLevierBars,
} from './to-sous-levier-bars';
import { useFormatImpactPotentiel } from './use-format-impact-potentiel';

type SousLeviersChartProps = {
  places: LevierPlace[];
  preselectedActions: readonly ActionDeReference[];
  selectedLevierId?: LevierId;
  selectedCategorie?: CategorieAction;
  onLevierSelected: SelectLevier;
};

const { colors } = preset.theme.extend;

const STATUS_SCALE: StatusScale<string> = [
  { status: toMobilisationLabel('none'), color: colors.grey[3] },
  { status: toMobilisationLabel('partial'), color: colors.info[3] },
  { status: toMobilisationLabel('good'), color: colors.info[1] },
  { status: toMobilisationLabel('full'), color: colors.primary[9] },
  { status: appLabels.ajouteeALaPreselection, color: colors.warning[1] },
];

const DATA_TABLE_LABELS = {
  toggle: appLabels.voirLesDonneesDuGraphique,
  barHeader: appLabels.sousLevier,
  valueHeader: appLabels.axePotentiel,
  statusHeader: appLabels.axeMobilisation,
};

export const SousLeviersChart = ({
  places,
  preselectedActions,
  selectedLevierId,
  selectedCategorie,
  onLevierSelected,
}: SousLeviersChartProps): JSX.Element => {
  const bars = useMemo(
    () => toSousLevierBars(places, preselectedActions),
    [places, preselectedActions]
  );
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
    <div className="flex flex-col gap-4">
      <div className="h-matrix-chart">
        <StatusBarChart
          data={bars}
          statusScale={STATUS_SCALE}
          formatValue={formatValue}
          tooltipHint={appLabels.cliquerPourVoirLesActions}
          selectedBarId={toSelectedSousLevierId({
            levierId: selectedLevierId,
            categorie: selectedCategorie,
          })}
          onBarSelected={selectBar}
        >
          <Caption>{appLabels.sousLeviersLegende}</Caption>
        </StatusBarChart>
      </div>
      <StatusBarDataTable
        data={bars}
        formatValue={formatValue}
        labels={DATA_TABLE_LABELS}
      />
    </div>
  );
};
