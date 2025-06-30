import { PlanCreationNavigationLinks } from '@/app/plans/plans/create-plan/components/PlanCreationNavigationLinks';
import { Button, Modal } from '@/ui';

export const PlanCreationButton = ({
  collectiviteId,
  panierId,
  children,
}: {
  collectiviteId: number;
  panierId: string | undefined;
  children: React.ReactNode;
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
      <Button size="xs">{children}</Button>
    </Modal>
  );
};
