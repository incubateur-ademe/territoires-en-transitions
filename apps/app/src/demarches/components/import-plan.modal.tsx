'use client';

import { appLabels } from '@/app/labels/catalog';
import { AiImportBetaLabel } from '@/app/plans/plans/import-plan/ai-import-beta-label';
import { AiImportFlow } from '@/app/plans/plans/import-plan/ai-import.flow';
import { Button, Modal } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useState } from 'react';

type Props = {
  openState: OpenState;
  /** Type de plan attendu par la démarche, imposé à l'import. */
  planTypeId: number | undefined;
  /**
   * `startedHere` : l'import a été lancé depuis cette modale, même fermée et
   * rouverte depuis, et non repris d'un import lancé ailleurs.
   */
  onPlanImported: (planId: number, options: { startedHere: boolean }) => void;
};

export const DemarcheImportPlanModal = ({
  openState,
  planTypeId,
  onPlanImported,
}: Props) => {
  // Hors du rendu de la modale, qui démonte le formulaire à la fermeture.
  const [startedJobId, setStartedJobId] = useState<string | null>(null);

  return (
    <Modal
      size="lg"
      title={
        <AiImportBetaLabel>{appLabels.importPlanIaTitre}</AiImportBetaLabel>
      }
      openState={openState}
      dataTest="demarches.plan.import-plan-modal"
      render={({ close }) => (
        <AiImportFlow
          lockedPlanTypeId={planTypeId}
          onImportStarted={setStartedJobId}
          onPlanCreated={(planId, { jobId }) => {
            onPlanImported(planId, { startedHere: jobId === startedJobId });
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
};
