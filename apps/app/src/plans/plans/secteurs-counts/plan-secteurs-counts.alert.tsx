'use client';

import { appLabels } from '@/app/labels/catalog';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { Alert, Button, Icon } from '@tet/ui';
import { ReactNode } from 'react';
import { useListPlanFichesSecteursAVerifier } from './data/use-list-plan-fiches-secteurs-a-verifier';
import { useListPlanSecteursCounts } from './data/use-list-plan-secteurs-counts';
import {
  PlanSecteursVerificationPanel,
  toFichesAVerifier,
} from './plan-secteurs-verification.panel';

export const PlanSecteursCountsAlert = ({
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

  const { enCoursDeCalcul, aRenseigner, nonAttribuables } = counts;
  const aVerifier = aRenseigner + nonAttribuables;
  if (aVerifier === 0 && enCoursDeCalcul === 0) {
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
    <div className="mb-6" data-test="plans.secteurs-counts-alert">
      <Alert
        state="warning"
        title={appLabels.planSecteursBanniereTitre}
        description={
          <div className="flex flex-wrap items-center gap-2">
            {aRenseigner > 0 && (
              <Pastille>
                {appLabels.planSecteursARenseigner({ count: aRenseigner })}
              </Pastille>
            )}
            {nonAttribuables > 0 && (
              <Pastille>
                {appLabels.planSecteursNonAttribuables({
                  count: nonAttribuables,
                })}
              </Pastille>
            )}
            {enCoursDeCalcul > 0 && (
              <span
                className="flex items-center gap-1 whitespace-nowrap text-sm text-grey-8"
                title={appLabels.planSecteursEnAttente}
              >
                <Icon icon="loader-4-line" size="sm" />
                {appLabels.planSecteursEnCoursDeCalcul({
                  count: enCoursDeCalcul,
                })}
              </span>
            )}
          </div>
        }
        action={
          aVerifier > 0 && (
            <Button
              size="sm"
              variant="outlined"
              onClick={ouvrirVerification}
              dataTest="plans.secteurs-counts-alert.verifier"
            >
              {appLabels.planSecteursVerifier}{' '}
              {appLabels.planSecteursAction({ count: aVerifier })}
            </Button>
          )
        }
      />
    </div>
  );
};

const Pastille = ({ children }: { children: ReactNode }) => (
  <span className="whitespace-nowrap rounded-full border border-warning-3 bg-white px-3 py-0.5 text-sm font-medium text-grey-9">
    {children}
  </span>
);
