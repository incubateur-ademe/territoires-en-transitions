'use client';

import {
  ImportPlanModal,
  ImportPlanProps,
} from '@/app/plans/plans/import-plan/import-plan.modal';
import { useSupportMode } from '@/app/users/authorizations/support-mode/support-mode.provider';
import { useUser } from '@tet/api/users';
import { Button } from '@tet/ui';

export const ImportPlanButton = ({ collectiviteId }: ImportPlanProps) => {
  const user = useUser();
  const { isSupportModeEnabled: isSupportModeActive } = useSupportMode();

  // Le bouton est visible uniquement si l'utilisateur a le rôle support ET que le mode support est actif
  if (user.isSupport === false || !isSupportModeActive) {
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
