'use client';
import { CreatePlanButton } from '@/app/plans/plans/create-plan/components/create-plan.button';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import { EmptyCard } from '@tet/ui';

export const EmptyAllPlansView = ({
  collectiviteId,
  panierId,
}: {
  collectiviteId: number;
  panierId: string | undefined;
}) => {
  return (
    <EmptyCard
      picto={() => <PictoDashboard height="160" width="160" />}
      title="Vous n'avez pas encore crée de plan d'action !"
      description={[
        "Vous pouvez créer votre plan d'action, qu'il soit déjà voté ou encore en cours d'élaboration.",
        'Les fiches seront modifiables à tout moment et vous pourrez les piloter depuis cette page !',
      ]}
      actions={[
        <CreatePlanButton
          key="create-plan-button"
          collectiviteId={collectiviteId}
          panierId={panierId}
          size="xl"
        >
          <h5 className="text-white mb-0">{"Créer un plan d'action"}</h5>
        </CreatePlanButton>,
      ]}
    />
  );
};
