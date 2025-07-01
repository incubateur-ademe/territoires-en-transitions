import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { PlanNode } from '@/app/plans/plans/types';
import PictoAction from '@/app/ui/pictogrammes/PictoAction';
import { EmptyCard } from '@/ui';
import { EditPlanButtons } from './edit-plan.buttons';

export const EmptyPlanAction = ({
  currentCollectivite,
  plan,
}: {
  currentCollectivite: CurrentCollectivite;
  plan: PlanNode;
}) => {
  return (
    <EmptyCard
      picto={() => <PictoAction height="100" width="100" />}
      title="Vous n'avez aucune fiche action ni arborescence de plan"
      description="Vous n'avez aucune fiche action ni arborescence de plan"
      actions={[
        <EditPlanButtons
          plan={plan}
          currentAxe={{
            id: plan.id,
            nom: '',
            depth: 0,
            fiches: [],
            parent: plan.id,
          }}
          collectiviteId={currentCollectivite.collectiviteId}
        />,
      ]}
    />
  );
};
