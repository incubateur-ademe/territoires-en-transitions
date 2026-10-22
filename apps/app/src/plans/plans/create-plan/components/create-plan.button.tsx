'use client';

import { useIsVisitor } from '@/app/users/authorizations/use-is-visitor';
import { Button, ButtonSize } from '@tet/ui';
import { AddPlanModal } from '../create-plan.modal';
import { appLabels } from '@/app/labels/catalog';

export const CreatePlanButton = ({
  collectiviteId,
  size = 'sm',
}: {
  collectiviteId: number;
  size?: ButtonSize;
}) => {
  const isVisitor = useIsVisitor();
  if (isVisitor) return null;

  return (
    <AddPlanModal collectiviteId={collectiviteId}>
      <Button size={size}>{appLabels.ajouterPlan}</Button>
    </AddPlanModal>
  );
};
