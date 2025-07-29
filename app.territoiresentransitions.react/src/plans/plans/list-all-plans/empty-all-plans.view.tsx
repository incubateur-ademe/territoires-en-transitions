'use client';
import { CreatePlanButton } from '@/app/plans/plans/create-plan/components/create-plan.button';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import { EmptyCard } from '@/ui';

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
      title="Vous n'avez pas encore créer de plan d'action!"
      description={[
        "Vous pouvez créer votre plan d'action, qu'il soit déjà voté ou encore en cours d'élaboration.",
        'Les fiches seront modifiables à tout moment et vous pourrez les piloter depuis ce tableau de bord!',
      ]}
      actions={[
        <CreatePlanButton
          key="create-plan-button"
          collectiviteId={collectiviteId}
          panierId={panierId}
          size="xl"
        >
          {"Créer un plan d'action"}
        </CreatePlanButton>,
      ]}
    />
  );
};
