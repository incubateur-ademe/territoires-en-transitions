import { CollectiviteNiveauAcces } from '@/api/collectivites/fetch-collectivite-niveau-acces';
import { Content } from '@/app/app/pages/collectivite/PlansActions/PlanAction/Content';
import { PlanNode } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/types';
import { PlanActionFiltersProvider } from '@/app/app/pages/collectivite/PlansActions/PlanAction/Filtres/context/PlanActionFiltersContext';
import { TPlanType } from '@/app/types/alias';

type PlanActionProps = {
  currentCollectivite: CollectiviteNiveauAcces;
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
      <Content {...props} />
    </PlanActionFiltersProvider>
  );
};
