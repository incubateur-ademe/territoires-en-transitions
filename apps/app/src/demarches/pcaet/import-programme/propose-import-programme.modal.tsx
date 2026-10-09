'use client';

import { useGetDocumentFile } from '@/app/collectivites/documents/data/use-get-document-file';
import {
  findPcaetPlanType,
  makeProgrammeActionsPlanName,
} from '@/app/demarches/pcaet/constants';
import { appLabels } from '@/app/labels/catalog';
import { isAiImportVerifiable } from '@/app/plans/plans/import-plan/ai-import.form';
import { useEnqueueAiImport } from '@/app/plans/plans/import-plan/data/use-enqueue-ai-import';
import { useFindPreviousAiImport } from '@/app/plans/plans/import-plan/data/use-find-previous-ai-import';
import { PreviousAiImportAlert } from '@/app/plans/plans/import-plan/previous-ai-import.alert';
import { useListPlanTypes } from '@/app/plans/plans/use-list-plan-types';
import { BetaLabel } from '@/app/ui/beta.label';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { getErrorMessage } from '@tet/domain/utils';
import { Alert, Modal, ModalFooterOKCancel } from '@tet/ui';
import { useImportProgramme } from './import-programme.context';

type Props = {
  /** Programme d'actions qui vient d'être déposé. */
  fichierId: number;
  dateLancement: string | null;
  onClose: () => void;
};

/**
 * Proposée au dépôt du programme d'actions : le document est déjà là, l'import
 * part de lui sans rien redemander. Nom et type du plan sont ceux que l'étape
 * Programme d'actions proposerait.
 */
export const ProposeImportProgrammeModal = ({
  fichierId,
  dateLancement,
  onClose,
}: Props) => {
  const { collectiviteId, nom: collectiviteNom } = useCurrentCollectivite();
  const { setToast } = useToastContext();
  const { trackImport } = useImportProgramme();
  const { data: planTypes } = useListPlanTypes();
  const pcaetPlanType = findPcaetPlanType(planTypes);
  const {
    data: file,
    isLoading: isLoadingFile,
    isError: isFileError,
  } = useGetDocumentFile({ collectiviteId, fichierId });
  const { mutateAsync: enqueue, isPending } = useEnqueueAiImport();
  const { previousImport, isLoading: isCheckingPreviousImport } =
    useFindPreviousAiImport({ fichierId });

  const startImport = async () => {
    if (!file) {
      return;
    }
    try {
      const { jobId, planId } = await enqueue({
        collectiviteId,
        file,
        planName: makeProgrammeActionsPlanName({
          dateLancement,
          collectiviteNom,
        }),
        planType: pcaetPlanType?.id,
        withVerifications: isAiImportVerifiable(file),
        withSousActions: true,
        confirmReimport: previousImport !== null,
      });
      trackImport(jobId, planId);
      setToast('info', appLabels.demarcheProgrammeImportLance);
      onClose();
    } catch (error) {
      setToast('error', getErrorMessage(error));
    }
  };

  return (
    <Modal
      size="md"
      openState={{
        isOpen: true,
        setIsOpen: (isOpen) => {
          if (!isOpen) onClose();
        },
      }}
      title={<BetaLabel>{appLabels.demarcheProgrammeImportTitre}</BetaLabel>}
      dataTest="demarches.documents.propose-import-programme-modal"
      render={() => (
        <div className="flex flex-col gap-4">
          <p className="m-0">{appLabels.demarcheProgrammeImportDescription}</p>
          <p className="m-0">{appLabels.demarcheProgrammeImportArrierePlan}</p>
          {previousImport && (
            <PreviousAiImportAlert previousImport={previousImport} />
          )}
          {isFileError && (
            <Alert
              state="error"
              description={appLabels.demarcheProgrammeImportFichierErreur}
            />
          )}
        </div>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            children: appLabels.demarcheProgrammeImportPlusTard,
            onClick: close,
            dataTest: 'demarches.documents.propose-import-programme.plus-tard',
          }}
          btnOKProps={{
            children: previousImport
              ? appLabels.importPlanIaRelancerQuandMeme
              : appLabels.demarcheProgrammeImportLancer,
            icon: 'import-line',
            onClick: startImport,
            loading: isLoadingFile || isCheckingPreviousImport || isPending,
            disabled: !file || pcaetPlanType === undefined || isPending,
            dataTest: 'demarches.documents.propose-import-programme.lancer',
          }}
        />
      )}
    />
  );
};
