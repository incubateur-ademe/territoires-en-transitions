'use client';

import { appLabels } from '@/app/labels/catalog';
import { AiImportFlow } from '@/app/plans/plans/import-plan/ai-import.flow';
import { Button, Modal } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';

type Props = {
  openState: OpenState;
  /** Type de plan attendu par la démarche, imposé à l'import. */
  planTypeId: number | undefined;
  onPlanImported: (planId: number, options: { startedHere: boolean }) => void;
};

export const DemarcheImportPlanModal = ({
  openState,
  planTypeId,
  onPlanImported,
}: Props) => (
  <Modal
    size="lg"
    title={`${appLabels.importPlanIaTitre} (${appLabels.importPlanIaBeta})`}
    openState={openState}
    dataTest="demarches.plan.import-plan-modal"
    render={({ close }) => (
      <AiImportFlow
        lockedPlanTypeId={planTypeId}
        onPlanCreated={(planId, options) => {
          onPlanImported(planId, options);
          close();
        }}
        cancelButton={
          <Button variant="outlined" type="button" onClick={close}>
            {appLabels.annuler}
          </Button>
        }
      />
    )}
  />
);
