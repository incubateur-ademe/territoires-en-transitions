import { appLabels } from '@/app/labels/catalog';
import { Plan } from '@tet/domain/plans';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { OpenState } from '@tet/ui/utils/types';
import { PropsWithChildren, ReactElement, useState } from 'react';
import { GenerateReportPending } from './generate-report-pending';
import {
  GenerateReportForm,
  GenerateReportFormArgs,
} from './generate-report.form';
import { useGenerateReport } from './use-generate-report';

export type GenerateReportPlanModalProps = {
  plan: Plan;
  openState?: OpenState;
  onGenerationStarted?: (reportId: string) => void;
};

const FORM_ID = 'generate-plan-report-form';

export const GenerateReportPlanModal = ({
  plan,
  onGenerationStarted,
  openState,
  children,
}: PropsWithChildren<GenerateReportPlanModalProps>) => {
  const [reportId, setReportId] = useState<string | null>(null);
  const { mutate: generateReport, isPending: isSubmittingGeneration } =
    useGenerateReport(plan.id);

  return (
    <Modal
      openState={{
        isOpen: openState?.isOpen ?? false,
        setIsOpen: (open) => {
          openState?.setIsOpen(open);
          if (!open) setReportId(null);
        },
      }}
      size="md"
    >
      {children && (
        <Modal.Trigger>{children as ReactElement}</Modal.Trigger>
      )}
      <Modal.Header>
        <Modal.Title>
          {reportId
            ? appLabels.generationRapportEnCours
            : appLabels.genererRapportPlanPowerpoint}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
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
      </Modal.Body>
      <Modal.Footer>
        {reportId ? (
          <Modal.Cancel>{appLabels.valider}</Modal.Cancel>
        ) : (
          <>
            <Modal.Cancel disabled={isSubmittingGeneration}>
              {appLabels.annuler}
            </Modal.Cancel>
            <Modal.Ok
              type="submit"
              form={FORM_ID}
              pending={isSubmittingGeneration}
            >
              {isSubmittingGeneration
                ? appLabels.generationEnCours
                : appLabels.generer}
            </Modal.Ok>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};
