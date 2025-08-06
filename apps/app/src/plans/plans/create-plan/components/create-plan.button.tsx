'use client';
import { useIsVisitor } from '@/app/core-logic/hooks/permissions/useIsVisitor';
import { CreatePlanOptionLinksList } from '@/app/plans/plans/create-plan/components/create-plan-option-link.list.tsx';
import { Button, ButtonSize, Modal } from '@/ui';

export const CreatePlanButton = ({
  collectiviteId,
  panierId,
  children,
  size = 'xs',
}: {
  collectiviteId: number;
  panierId: string | undefined;
  children: React.ReactNode;
  size?: ButtonSize;
}) => {
  const isVisitor = useIsVisitor();
  if (isVisitor) return null;

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
      <Button size={size}>{children}</Button>
    </Modal>
  );
};
