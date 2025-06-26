import { PlanCreationNavigationLinks } from '@/app/plans/plans/create-plan/components/PlanCreationNavigationLinks';
import { Button, Modal } from '@/ui';

export const PlanCreationButton = ({
  collectiviteId,
  panierId,
}: {
  collectiviteId: number;
  panierId: string | undefined;
}) => {
  return (
    <Modal
      title="Créer un plan d'action"
      render={() => (
        <div className="flex gap-4">
          <PlanCreationNavigationLinks
            collectiviteId={collectiviteId}
            panierId={panierId}
          />
        </div>
      )}
      renderFooter={({ close }) => (
        <div className="flex justify-center">
          <Button size="xs" onClick={close} variant="outlined">
            Annuler
          </Button>
        </div>
      )}
    >
      <Button size="xs">Créer un plan d'action</Button>
    </Modal>
  );
};
