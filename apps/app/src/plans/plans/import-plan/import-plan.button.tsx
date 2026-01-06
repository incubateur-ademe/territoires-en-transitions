'use client';

import {
  ImportPlanModal,
  ImportPlanProps,
} from '@/app/plans/plans/import-plan/import-plan.modal';
import { useSupportMode } from '@/app/users/authorizations/support-mode/support-mode.provider';
import { Button } from '@tet/ui';

export const ImportPlanButton = ({ collectiviteId }: ImportPlanProps) => {
  const { isSupportModeEnabled } = useSupportMode();

  if (!isSupportModeEnabled) {
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
