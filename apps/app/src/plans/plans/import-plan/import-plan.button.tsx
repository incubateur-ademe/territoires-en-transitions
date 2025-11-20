'use client';

import {
  ImportPlanModal,
  ImportPlanProps,
} from '@/app/plans/plans/import-plan/import-plan.modal';
import { useDemoMode } from '@/app/users/demo-mode-support-provider';
import { useUser } from '@tet/api/users';
import { Button } from '@tet/ui';

export const ImportPlanButton = ({ collectiviteId }: ImportPlanProps) => {
  const user = useUser();
  const isDemoMode = useDemoMode();

  if (user.isSupport === false || isDemoMode.isDemoMode === true) {
    return null;
  }

  return (
    <ImportPlanModal collectiviteId={collectiviteId}>
      <Button variant="primary" size="xs" className="whitespace-nowrap">
        Importer un plan
      </Button>
    </ImportPlanModal>
  );
};
