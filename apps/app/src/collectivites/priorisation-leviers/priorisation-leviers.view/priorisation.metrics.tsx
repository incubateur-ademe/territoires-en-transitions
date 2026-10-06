import { appLabels } from '@/app/labels/catalog';
import { VisibleWhen } from '@tet/ui';
import { JSX } from 'react';

type PriorisationMetricsProps = {
  preselectedActionsCount: number;
  blindSpotCount: number;
  analyzedActionsCount: number;
};

type MetricTileProps = {
  count: number;
  label: string;
  help?: string;
};

const MetricTile = ({ count, label, help }: MetricTileProps): JSX.Element => {
  const hasHelp = help !== undefined;
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-grey-3 bg-white p-6">
      <span className="text-3xl font-bold leading-none text-primary-9">
        {count}
      </span>
      <span className="text-sm text-grey-9">{label}</span>
      <VisibleWhen condition={hasHelp}>
        <span className="text-xs text-grey-7">{help}</span>
      </VisibleWhen>
    </div>
  );
};

export const PriorisationMetrics = ({
  preselectedActionsCount,
  blindSpotCount,
  analyzedActionsCount,
}: PriorisationMetricsProps): JSX.Element => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
    <MetricTile
      count={preselectedActionsCount}
      label={appLabels.actionsPreselectionnees({
        count: preselectedActionsCount,
        withoutCount: true,
      })}
      help={appLabels.actionsPreselectionneesAide}
    />
    <MetricTile
      count={blindSpotCount}
      label={appLabels.leviersEnAngleMort({
        count: blindSpotCount,
        withoutCount: true,
      })}
      help={appLabels.leviersEnAngleMortAide}
    />
    <MetricTile
      count={analyzedActionsCount}
      label={appLabels.actionsAnalysees({
        count: analyzedActionsCount,
        withoutCount: true,
      })}
    />
  </div>
);
