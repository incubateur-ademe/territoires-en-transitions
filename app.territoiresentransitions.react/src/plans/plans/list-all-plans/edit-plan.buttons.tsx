'use client';
import { useCreateFicheAction } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheAction';
import { CreatePlanButton } from '@/app/plans/plans/create-plan/components/create-plan.button';
import { Button } from '@/ui/design-system/Button';

export const EditPlanButtons = ({
  collectiviteId,
  panierId,
}: {
  collectiviteId: number;
  panierId: string | undefined;
}) => {
  const { mutate: createFicheAction } = useCreateFicheAction();

  return (
    <div className="flex items-center gap-4">
      <Button size="xs" variant="outlined" onClick={() => createFicheAction()}>
        Créer une fiche action
      </Button>
      <CreatePlanButton collectiviteId={collectiviteId} panierId={panierId}>
        Créer un plan d'action
      </CreatePlanButton>
    </div>
  );
};
