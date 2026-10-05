import { appLabels } from '@/app/labels/catalog';
import type { PlanSecteursCounts } from './data/use-list-plan-secteurs-counts';

export const formatPlanSecteursCounts = ({
  enCoursDeCalcul,
  aRenseigner,
  nonAttribuables,
}: PlanSecteursCounts): string | null => {
  const parts = [
    enCoursDeCalcul > 0 &&
      appLabels.planSecteursEnCoursDeCalcul({ count: enCoursDeCalcul }),
    aRenseigner > 0 &&
      appLabels.planSecteursARenseigner({ count: aRenseigner }),
    nonAttribuables > 0 &&
      appLabels.planSecteursNonAttribuables({ count: nonAttribuables }),
  ].filter((part) => part !== false);

  return parts.length > 0 ? parts.join(', ') : null;
};
