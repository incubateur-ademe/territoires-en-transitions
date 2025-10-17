import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import PictoAction from '@/app/ui/pictogrammes/PictoAction';
import { PlanNode } from '@/domain/plans';
import { EmptyCard } from '@/ui';
import { EditPlanButtons } from './edit-plan.buttons';

export const EmptyPlanView = ({
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
          key={plan.id}
          plan={plan}
          currentAxe={plan}
          collectiviteId={currentCollectivite.collectiviteId}
        />,
      ]}
    />
  );
};
