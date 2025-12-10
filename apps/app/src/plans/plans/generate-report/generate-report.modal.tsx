import { Plan } from '@/domain/plans';
import { Modal, ModalFooterOKCancel } from '@/ui';
import { PropsWithChildren } from 'react';
import { GenerateReportForm } from './generate-report.form';

export type GenerateReportPlanModalProps = {
  plan: Plan;
};
const FORM_ID = 'generate-plan-report-form';
export const GenerateReportPlanModal = ({
  plan,
  children,
}: PropsWithChildren<GenerateReportPlanModalProps>) => {
  return (
    <Modal
      title="Télécharger le rapport de mon plan au format PowerPoint"
      size="md"
      render={({ descriptionId, close }) => (
        <div id={descriptionId} className="space-y-6">
          <GenerateReportForm formId={FORM_ID} plan={plan} />
          {/*
          {isLoading && (
            <p className="text-grey-7">{`Import en cours, cela peut prendre quelques secondes.`}</p>
          )}
          {errorMessage && (
            <p
              className="text-red-600"
              dangerouslySetInnerHTML={{ __html: errorMessage }}
            />
          )}*/}
        </div>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            onClick: close,
          }}
          btnOKProps={{
            children: 'Télécharger',
            form: FORM_ID,
          }}
        />
      )}
    >
      {children as React.ReactElement}
    </Modal>
  );
};
