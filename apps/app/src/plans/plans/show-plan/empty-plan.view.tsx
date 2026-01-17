import PictoAction from '@/app/ui/pictogrammes/PictoAction';
import { CollectiviteCurrent } from '@tet/api/collectivites';
import { PlanNode } from '@tet/domain/plans';
import { EmptyCard } from '@tet/ui';
import { EditPlanButtons } from './edit-plan.buttons';

export const EmptyPlanView = ({
  currentCollectivite,
  plan,
}: {
  currentCollectivite: CollectiviteCurrent;
  plan: PlanNode;
}) => {
  return (
    <EmptyCard
      picto={() => <PictoAction height="100" width="100" />}
      title="Vous n'avez aucune action ni arborescence de plan"
      description="Vous n'avez aucune action ni arborescence de plan"
      actions={[
        <EditPlanButtons
          key={plan.id}
          plan={plan}
          currentAxe={plan}
          collectiviteId={currentCollectivite.collectiviteId}
        />,
      ]}
    />
  );
};
