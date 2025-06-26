'use client';
import { PlanCreationButton } from '@/app/plans/plans/create-plan/components/PlanCreationButton';
import { Button } from '@/ui/design-system/Button';

export const Actions = ({
  collectiviteId,
  panierId,
}: {
  collectiviteId: number;
  panierId: string | undefined;
}) => {
  return (
    <div className="flex items-center gap-4">
      <Button
        size="xs"
        variant="outlined"
        disabled
        onClick={() => {
          console.log('click');
        }}
      >
        Créer une fiche action
      </Button>
      <PlanCreationButton collectiviteId={collectiviteId} panierId={panierId} />
    </div>
  );
};
