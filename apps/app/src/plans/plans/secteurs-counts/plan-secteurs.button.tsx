'use client';

import { appLabels } from '@/app/labels/catalog';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { countPlanSecteursARenseigner } from '@tet/domain/plans';
import { Button } from '@tet/ui';
import { useCallback, useEffect, useRef } from 'react';
import { useListPlanSecteursCounts } from './data/use-list-plan-secteurs-counts';
import { PlanSecteursVerificationPanel } from './plan-secteurs-verification.panel';
import {
  PLAN_SECTEURS_LISTE,
  usePlanSecteursVue,
} from './use-plan-secteurs-vue';

export const PlanSecteursButton = ({
  collectiviteId,
  planId,
  isPlanAVerifier,
}: {
  collectiviteId: number;
  planId: number;
  /**
   * Plan importé pas encore validé : renseigner le dernier secteur n'achève
   * pas la vérification, le panneau reste ouvert sur sa liste vide.
   */
  isPlanAVerifier: boolean;
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
  const aRenseigner =
    counts === undefined ? undefined : countPlanSecteursARenseigner(counts);
  const { setToast } = useToastContext();

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

  // Dernier secteur renseigné depuis le panneau : rien d'autre à faire ici.
  const previousARenseigner = useRef(aRenseigner);
  useEffect(() => {
    const previous = previousARenseigner.current;
    previousARenseigner.current = aRenseigner;
    if (
      isOuvert &&
      !isPlanAVerifier &&
      previous !== undefined &&
      previous > 0 &&
      aRenseigner === 0
    ) {
      setToast('success', appLabels.planSecteursTousRenseignesToast);
      setPanel({ type: 'close' });
    }
  }, [aRenseigner, isOuvert, isPlanAVerifier, setToast, setPanel]);

  if (!isEnabled || aRenseigner === undefined || aRenseigner === 0) {
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
