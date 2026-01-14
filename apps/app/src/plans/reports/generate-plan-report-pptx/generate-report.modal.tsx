import { Plan } from '@tet/domain/plans';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { PropsWithChildren, useState } from 'react';
import { GenerateReportPending } from './generate-report-pending';
import {
  GenerateReportForm,
  GenerateReportFormArgs,
} from './generate-report.form';
import { useGenerateReport } from './use-generate-report';

export type GenerateReportPlanModalProps = {
  plan: Plan;
  onGenerationStarted?: (reportId: string) => void;
};
const FORM_ID = 'generate-plan-report-form';
export const GenerateReportPlanModal = ({
  plan,
  onGenerationStarted,
  children,
}: PropsWithChildren<GenerateReportPlanModalProps>) => {
  const [reportId, setReportId] = useState<string | null>(null);
  const { mutate: generateReport, isPending: isSubmittingGeneration } =
    useGenerateReport(plan.id);

  return (
    <Modal
      title={reportId ? "Génération de votre rapport en cours" : "Télécharger le rapport de mon plan au format PowerPoint"}
      size="md"
      onClose={() => {
        setReportId(null);
      }}
      noCloseButton={isSubmittingGeneration}
      disableDismiss={isSubmittingGeneration}
      render={({ descriptionId }) => (
        <div id={descriptionId} className="space-y-6">
          {reportId ? (
            <GenerateReportPending />
          ) : (
            <GenerateReportForm
              formId={FORM_ID}
              plan={plan}
              onSubmit={async (data: GenerateReportFormArgs) => {
                generateReport(data, {
                  onSuccess: ({ id }) => {
                    setReportId(id);
                    onGenerationStarted?.(id);
                  },
                });
              }}
              disabled={isSubmittingGeneration}
            />
          )}
        </div>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={
            reportId
              ? undefined
              : {
                  onClick: close,
                  disabled: isSubmittingGeneration,
                }
          }
          btnOKProps={
            reportId
              ? {
                  children: 'Valider',
                  onClick: () => {
                    close();
                  },
                }
              : {
                  disabled: isSubmittingGeneration,
                  loading: isSubmittingGeneration,
                  children: isSubmittingGeneration
                    ? 'Génération en cours'
                    : 'Télécharger',
                  form: FORM_ID,
                }
          }
        />
      )}
    >
      {children as React.ReactElement}
    </Modal>
  );
};
