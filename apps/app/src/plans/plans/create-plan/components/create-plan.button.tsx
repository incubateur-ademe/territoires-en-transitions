'use client';

import { useIsVisitor } from '@/app/users/authorizations/use-is-visitor';
import { Button, ButtonSize } from '@tet/ui';
import { CreatePlanModal } from '../create-plan.modal';

export const CreatePlanButton = ({
  collectiviteId,
  panierId,
  size = 'xs',
}: {
  collectiviteId: number;
  panierId: string | undefined;
  size?: ButtonSize;
}) => {
  const isVisitor = useIsVisitor();
  if (isVisitor) return null;

  return (
    <CreatePlanModal collectiviteId={collectiviteId} panierId={panierId}>
      <Button size={size}>{'Créer un plan'}</Button>
    </CreatePlanModal>
  );
};
