'use client';

import { appLabels } from '@/app/labels/catalog';
import { Alert } from '@tet/ui';
import { useListPlanSecteursCounts } from './data/use-list-plan-secteurs-counts';
import { formatPlanSecteursCounts } from './format-plan-secteurs-counts';

export const PlanSecteursCountsAlert = ({
  collectiviteId,
  planId,
}: {
  collectiviteId: number;
  planId: number;
}) => {
  const { isEnabled, countsByPlanId } = useListPlanSecteursCounts(
    collectiviteId,
    [planId]
  );
  const counts = countsByPlanId.get(planId);
  const description = counts && formatPlanSecteursCounts(counts);

  if (!isEnabled || !description) {
    return null;
  }

  return (
    <div className="mb-6" data-test="plans.secteurs-counts-alert">
      <Alert
        state="warning"
        title={appLabels.planSecteursBanniereTitre}
        description={description}
      />
    </div>
  );
};
