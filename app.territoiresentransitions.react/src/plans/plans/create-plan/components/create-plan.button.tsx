import { CreatePlanOptionLinksList } from '@/app/plans/plans/create-plan/components/create-plan-option-link.list.tsx';
import { Button, Modal } from '@/ui';

export const CreatePlanButton = ({
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
      size="lg"
      title="Créer un plan d'action"
      render={() => (
        <div className="flex gap-4">
          <CreatePlanOptionLinksList
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
