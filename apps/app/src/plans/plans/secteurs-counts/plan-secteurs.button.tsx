'use client';

import { appLabels } from '@/app/labels/catalog';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { countPlanSecteursARenseigner } from '@tet/domain/plans';
import { Button } from '@tet/ui';
import { useCallback, useEffect } from 'react';
import { useListPlanSecteursCounts } from './data/use-list-plan-secteurs-counts';
import { PlanSecteursVerificationPanel } from './plan-secteurs-verification.panel';
import {
  PLAN_SECTEURS_LISTE,
  usePlanSecteursVue,
} from './use-plan-secteurs-vue';

export const PlanSecteursButton = ({
  collectiviteId,
  planId,
}: {
  collectiviteId: number;
  planId: number;
}) => {
  const [vue, setVue] = usePlanSecteursVue();
  const onClose = useCallback(() => void setVue(null), [setVue]);
  const { setPanel } = useSidePanel({ onClose });
  const { isEnabled, countsByPlanId } = useListPlanSecteursCounts(
    collectiviteId,
    [planId]
  );
  const counts = countsByPlanId.get(planId);
  const isOuvert = vue !== null;

  useEffect(() => {
    if (!isOuvert) {
      return;
    }
    setPanel({
      type: 'open',
      title: appLabels.planSecteursVerifierTitre,
      content: (
        <PlanSecteursVerificationPanel
          collectiviteId={collectiviteId}
          planId={planId}
        />
      ),
    });
  }, [isOuvert, collectiviteId, planId, setPanel]);

  if (!isEnabled || !counts) {
    return null;
  }

  const aRenseigner = countPlanSecteursARenseigner(counts);
  if (aRenseigner === 0) {
    return null;
  }

  return (
    <Button
      size="xs"
      variant="outlined"
      className="!py-0 bg-warning-2 hover:!bg-warning-2 border-warning-3 hover:!border-warning-1 text-warning-1 hover:text-warning-1"
      onClick={() => void setVue(PLAN_SECTEURS_LISTE)}
      dataTest="plans.secteurs-button"
    >
      {appLabels.planSecteursARenseignerBouton({ count: aRenseigner })}
    </Button>
  );
};
