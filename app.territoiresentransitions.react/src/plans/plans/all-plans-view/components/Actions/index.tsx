'use client';
import { useCreateFicheAction } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheAction';
import { PlanCreationButton } from '@/app/plans/plans/create-plan/components/PlanCreationButton';
import { Button } from '@/ui/design-system/Button';

export const Actions = ({
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
      <PlanCreationButton collectiviteId={collectiviteId} panierId={panierId}>
        Créer un plan d'action
      </PlanCreationButton>
    </div>
  );
};
