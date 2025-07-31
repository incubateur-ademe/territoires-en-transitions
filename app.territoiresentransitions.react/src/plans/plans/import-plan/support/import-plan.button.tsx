import { Button } from '@/ui';
import { ImportPlanModal, ImportPlanProps } from './import-plan.modal';

export const ImportPlanButton = ({ collectiviteId }: ImportPlanProps) => {
  return (
    <ImportPlanModal collectiviteId={collectiviteId}>
      <Button variant="primary" size="sm" className="whitespace-nowrap">
        Importer un plan
      </Button>
    </ImportPlanModal>
  );
};
