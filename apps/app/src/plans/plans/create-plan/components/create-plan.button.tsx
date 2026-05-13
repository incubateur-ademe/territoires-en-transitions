'use client';

import { useIsVisitor } from '@/app/users/authorizations/use-is-visitor';
import { Button, ButtonSize } from '@tet/ui';
import { useState } from 'react';
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
  const [open, setOpen] = useState(false);

  if (isVisitor) return null;

  return (
    <>
      <Button size={size} onClick={() => setOpen(true)}>
        {'Créer un plan'}
      </Button>
      <CreatePlanModal
        collectiviteId={collectiviteId}
        panierId={panierId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
};
