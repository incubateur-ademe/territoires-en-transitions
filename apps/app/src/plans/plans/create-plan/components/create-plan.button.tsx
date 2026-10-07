'use client';

import { useIsVisitor } from '@/app/users/authorizations/use-is-visitor';
import { Button, ButtonSize } from '@tet/ui';
import { CreatePlanModal } from '../create-plan.modal';

export const CreatePlanButton = ({
  collectiviteId,
  size = 'xs',
}: {
  collectiviteId: number;
  size?: ButtonSize;
}) => {
  const isVisitor = useIsVisitor();
  if (isVisitor) return null;

  return (
    <CreatePlanModal collectiviteId={collectiviteId}>
      <Button size={size}>{'Créer un plan'}</Button>
    </CreatePlanModal>
  );
};
