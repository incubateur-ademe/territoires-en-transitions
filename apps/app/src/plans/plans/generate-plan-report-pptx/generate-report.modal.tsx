import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { convertFileToBase64 } from '@/app/utils/convert-file-to-base64';
import { Plan } from '@tet/domain/plans';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { PropsWithChildren, useState } from 'react';
import { GenerateReportRunning } from './generate-report-running';
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
  const { mutate: generateReport, isPending: isGenerating } =
    useGenerateReport();

  return (
    <Modal
      title="Télécharger le rapport de mon plan au format PowerPoint"
      size="md"
      render={({ descriptionId }) => (
        <div id={descriptionId} className="space-y-6">
          {reportId ? (
            <GenerateReportRunning />
          ) : (
            <GenerateReportForm
              formId={FORM_ID}
              plan={plan}
              onSubmit={async (data: GenerateReportFormArgs) => {
                // Convert File to base64 if provided
                const logoFileBase64 = data.logoFile
                  ? await convertFileToBase64(data.logoFile)
                  : undefined;

                // Prepare the request payload (excluding the File object)
                const { logoFile, ...requestPayload } = data;
                const payload = {
                  ...requestPayload,
                  ...(logoFileBase64 ? { logoFile: logoFileBase64 } : {}),
                };

                generateReport(payload, {
                  onSuccess: ({ id }) => {
                    setReportId(id);
                    onGenerationStarted?.(id);
                  },
                });
              }}
              disabled={isGenerating}
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
                  disabled: isGenerating,
                }
          }
          btnOKProps={
            reportId
              ? {
                  children: 'Valider',
                  onClick: () => {
                    setReportId(null);
                    close();
                  },
                }
              : {
                  disabled: isGenerating,
                  children: isGenerating ? (
                    <>
                      <SpinnerLoader />
                      Génération en cours
                    </>
                  ) : (
                    'Télécharger'
                  ),
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
