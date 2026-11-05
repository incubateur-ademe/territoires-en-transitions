'use client';

import { appLabels } from '@/app/labels/catalog';
import { BetaLabel } from '@/app/ui/beta.label';
import { AiImportFlow } from '@/app/plans/plans/import-plan/ai-import.flow';
import type { AiImportDefaults } from '@/app/plans/plans/import-plan/ai-import.form';
import { Button, Modal } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useState } from 'react';
import { useQueryStates } from 'nuqs';
import { aiImportQueryState } from '@/app/plans/plans/import-plan/ai-import.query-state';

type Props = {
  openState: OpenState;
  /** Type de plan attendu par la démarche, imposé à l'import. */
  planTypeId: number | undefined;
  /** Fichier et nom proposés d'office, connus de la démarche. */
  importDefaults?: AiImportDefaults;
  /**
   * La fin de l'import est traitée par l'appelant, qui reste monté : la
   * modale peut être fermée pendant l'import.
   */
  onImportStarted: (jobId: string, planId: number | null) => void;
};

export const DemarcheImportPlanModal = ({
  openState,
  planTypeId,
  importDefaults,
  onImportStarted,
}: Props) => {
  const [, setImportQuery] = useQueryStates(aiImportQueryState);
  const [isProgressVisible, setIsProgressVisible] = useState(false);
  return (
    <Modal
      size={isProgressVisible ? 'sm' : 'lg'}
      title={<BetaLabel>{appLabels.importPlanIaTitre}</BetaLabel>}
      openState={openState}
      dataTest="demarches.plan.import-plan-modal"
      render={({ close }) => (
        <AiImportFlow
          lockedPlanTypeId={planTypeId}
          defaults={importDefaults}
          onImportStarted={onImportStarted}
          onPlanCreated={() => {
            // Le compte rendu reste dans l'historique. Une prochaine ouverture
            // doit permettre un nouvel import, pas refermer aussitôt la modale.
            void setImportQuery({ importJobId: null });
            close();
          }}
          onProgressVisibilityChange={setIsProgressVisible}
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
