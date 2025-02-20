import { Button } from '@/ui';
import {
  ImportPlanModal,
  ImportPlanProps
} from '@/app/app/pages/collectivite/PlansActions/ParcoursCreationPlan/Import/import-plan.modal';

export const ImportPlanButton = ({ collectiviteId }: ImportPlanProps) => {
  return (
    <ImportPlanModal collectiviteId={collectiviteId}>
      <Button variant="primary" size="sm" className="whitespace-nowrap">
        Importer un plan
      </Button>
    </ImportPlanModal>
  );
};

