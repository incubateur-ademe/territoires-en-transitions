'use client';

import { appLabels } from '@/app/labels/catalog';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { Button } from '@tet/ui';
import { useListPlanFichesSecteursAVerifier } from './data/use-list-plan-fiches-secteurs-a-verifier';
import { useListPlanSecteursCounts } from './data/use-list-plan-secteurs-counts';
import {
  PlanSecteursVerificationPanel,
  toFichesAVerifier,
} from './plan-secteurs-verification.panel';

export const PlanSecteursButton = ({
  collectiviteId,
  planId,
}: {
  collectiviteId: number;
  planId: number;
}) => {
  const { setPanel } = useSidePanel();
  const { isEnabled, countsByPlanId } = useListPlanSecteursCounts(
    collectiviteId,
    [planId]
  );
  const fiches = useListPlanFichesSecteursAVerifier(collectiviteId, planId);
  const counts = countsByPlanId.get(planId);

  if (!isEnabled || !counts) {
    return null;
  }

  const aRenseigner = counts.aRenseigner + counts.nonAttribuables;
  if (aRenseigner === 0) {
    return null;
  }

  const ouvrirVerification = () =>
    setPanel({
      type: 'open',
      title: appLabels.planSecteursVerifierTitre,
      content: (
        <PlanSecteursVerificationPanel
          planId={planId}
          fiches={toFichesAVerifier(fiches)}
        />
      ),
    });

  return (
    <Button
      size="sm"
      variant="outlined"
      icon="alert-line"
      className="bg-warning-2 hover:!bg-warning-2 border-warning-3 hover:!border-warning-1 text-warning-1 hover:text-warning-1 [&_svg]:fill-warning-1"
      onClick={ouvrirVerification}
      dataTest="plans.secteurs-button"
    >
      {appLabels.planSecteursARenseignerBouton({ count: aRenseigner })}
    </Button>
  );
};
