'use client';

import { Button } from '@tet/ui';
import {
  GenerateReportPlanModal,
  GenerateReportPlanModalProps,
} from './generate-report.modal';
import { useGeneratePptxPlanReportEnabled } from './use-generate-pptx-plan-report-enabled';

export const GenerateReportButton = ({
  plan,
}: GenerateReportPlanModalProps) => {
  const isGeneratePptxPlanReportEnabled = useGeneratePptxPlanReportEnabled();
  if (!isGeneratePptxPlanReportEnabled) {
    return null;
  }

  return (
    <GenerateReportPlanModal plan={plan}>
      <Button variant="white" size="sm" className="py-1.5">
        Générer un rapport
      </Button>
    </GenerateReportPlanModal>
  );
};
