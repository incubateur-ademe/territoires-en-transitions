'use client';

import { Button } from '@tet/ui';
import { useQueryState } from 'nuqs';
import { useEffect } from 'react';
import {
  GenerateReportPlanModal,
  GenerateReportPlanModalProps,
} from './generate-report.modal';
import { useGeneratePptxPlanReportEnabled } from './use-generate-pptx-plan-report-enabled';

export const GenerateReportButton = ({
  plan,
}: GenerateReportPlanModalProps) => {
  const [downloadReportId, setDownloadReportId] =
    useQueryState('downloadReportId');

  const isGeneratePptxPlanReportEnabled = useGeneratePptxPlanReportEnabled();
  if (!isGeneratePptxPlanReportEnabled) {
    return null;
  }

  useEffect(() => {
    if (downloadReportId) {
    }
  }, [downloadReportId]);

  return (
    <GenerateReportPlanModal plan={plan}>
      <Button variant="white" size="sm" className="py-1.5">
        Générer un rapport
      </Button>
    </GenerateReportPlanModal>
  );
};
