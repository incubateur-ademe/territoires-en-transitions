'use client';
import { CreatePlanButton } from '@/app/plans/plans/create-plan/components/create-plan.button';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { CollectiviteAccess } from '@tet/domain/users';
import { EmptyCard } from '@tet/ui';

export const EmptyAllPlansView = ({
  collectivite,
  panierId,
}: {
  collectivite: CollectiviteAccess;
  panierId: string | undefined;
}) => {
  return (
    <EmptyCard
      picto={() => <PictoDashboard height="160" width="160" />}
      title="Vous n'avez pas encore crée de plan !"
      description={[
        "Vous pouvez créer votre plan, qu'il soit déjà voté ou encore en cours d'élaboration.",
        'Les actions seront modifiables à tout moment et vous pourrez les piloter depuis cette page !',
      ]}
      actions={
        hasPermission(collectivite.permissions, 'plans.mutate')
          ? [
              <CreatePlanButton
                key="create-plan-button"
                collectiviteId={collectivite.collectiviteId}
                panierId={panierId}
                size="xl"
              >
                <h5 className="text-white mb-0">{'Créer un plan'}</h5>
              </CreatePlanButton>,
            ]
          : undefined
      }
    />
  );
};
