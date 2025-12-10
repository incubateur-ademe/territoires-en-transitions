'use client';

import { Button } from '@/ui';
import {
  GenerateReportPlanModal,
  GenerateReportPlanModalProps,
} from './generate-report.modal';

export const GenerateReportButton = ({
  plan,
}: GenerateReportPlanModalProps) => {
  return (
    <GenerateReportPlanModal plan={plan}>
      <Button variant="white" size="sm" className="py-1.5">
        Générer un rapport
      </Button>
    </GenerateReportPlanModal>
  );
};
