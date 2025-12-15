'use client';
import { CreatePlanOptionLinksList } from '@/app/plans/plans/create-plan/components/create-plan-option-link.list.tsx';
import { useIsVisitor } from '@/app/users/authorizations/use-is-visitor';
import { Button, ButtonSize, Modal } from '@tet/ui';

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
      title="Créer un plan"
      render={() => (
        <CreatePlanOptionLinksList
          collectiviteId={collectiviteId}
          panierId={panierId}
        />
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
