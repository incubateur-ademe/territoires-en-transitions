import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Plan } from '@tet/domain/plans';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { PropsWithChildren } from 'react';
import {
  GenerateReportForm,
  GenerateReportFormArgs,
} from './generate-report.form';
import { useGenerateReport } from './use-generate-report';

export type GenerateReportPlanModalProps = {
  plan: Plan;
};
const FORM_ID = 'generate-plan-report-form';
export const GenerateReportPlanModal = ({
  plan,
  children,
}: PropsWithChildren<GenerateReportPlanModalProps>) => {
  const { mutate: generateReport, isPending: isGenerating } =
    useGenerateReport();

  return (
    <Modal
      title="Télécharger le rapport de mon plan au format PowerPoint"
      size="md"
      render={({ descriptionId, close }) => (
        <div id={descriptionId} className="space-y-6">
          <GenerateReportForm
            formId={FORM_ID}
            plan={plan}
            onSubmit={(data: GenerateReportFormArgs) => {
              generateReport(data, {
                onSuccess: () => {
                  close();
                },
              });
            }}
            disabled={isGenerating}
          />
        </div>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            onClick: close,
            disabled: isGenerating,
          }}
          btnOKProps={{
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
          }}
        />
      )}
    >
      {children as React.ReactElement}
    </Modal>
  );
};
