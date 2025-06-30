import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { PlanNode } from '@/app/plans/plans/types';
import { TPlanType } from '@/app/types/alias';
import { PlanActionFiltersProvider } from './Filtres/context/PlanActionFiltersContext';
import { PlanActionView } from './PlanActionView';

type PlanActionProps = {
  currentCollectivite: CurrentCollectivite;
  /** Axe racine du plan d'action (depth = 0) */
  rootAxe: PlanNode;
  /** La liste des axes liés à ce plan d'action */
  axes: PlanNode[];
  /** Type du plan d'action */
  planType: TPlanType | null;
  planId: number;
  axeId?: number;
};

export const PlanAction = (props: PlanActionProps) => {
  const { collectiviteId } = props.currentCollectivite;

  const url = `/collectivite/${collectiviteId}/plans/plan/${props.planId}`;

  return (
    <PlanActionFiltersProvider
      url={url}
      collectivite={props.currentCollectivite}
      planId={props.planId}
    >
      <PlanActionView {...props} />
    </PlanActionFiltersProvider>
  );
};
