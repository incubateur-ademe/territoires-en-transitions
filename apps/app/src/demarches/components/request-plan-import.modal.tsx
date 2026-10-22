'use client';

import { appLabels } from '@/app/labels/catalog';
import { RequestPlanImportInfo } from '@/app/plans/plans/import-plan/request-plan-import.info';
import { Button, Modal, ModalFooter } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';

/** Import accompagné, proposé tant que l'import en Bêta n'est pas ouvert. */
export const DemarcheRequestPlanImportModal = ({
  openState,
}: {
  openState: OpenState;
}) => (
  <Modal
    size="lg"
    title={appLabels.importerUnPlan}
    openState={openState}
    dataTest="demarches.plan.request-plan-import-modal"
    render={() => <RequestPlanImportInfo />}
    renderFooter={({ close }) => (
      <ModalFooter>
        <Button variant="outlined" type="button" onClick={close}>
          {appLabels.fermer}
        </Button>
      </ModalFooter>
    )}
  />
);
