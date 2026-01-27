import PictoAction from '@/app/ui/pictogrammes/PictoAction';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { PlanNode } from '@tet/domain/plans';
import { CollectiviteAccess } from '@tet/domain/users';
import { EmptyCard } from '@tet/ui';
import { EditPlanButtons } from './edit-plan.buttons';

export const EmptyPlanView = ({
  currentCollectivite,
  plan,
}: {
  currentCollectivite: CollectiviteAccess;
  plan: PlanNode;
}) => {
  return (
    <EmptyCard
      picto={() => <PictoAction height="100" width="100" />}
      title="Vous n'avez aucune action ni arborescence de plan"
      description="Vous n'avez aucune action ni arborescence de plan"
      actions={
        hasPermission(currentCollectivite.permissions, 'plans.mutate')
          ? [
              <EditPlanButtons
                key={plan.id}
                plan={plan}
                currentAxe={plan}
                collectiviteId={currentCollectivite.collectiviteId}
                isActionsVisible={hasPermission(
                  currentCollectivite.permissions,
                  'plans.mutate'
                )}
              />,
            ]
          : undefined
      }
    />
  );
};
