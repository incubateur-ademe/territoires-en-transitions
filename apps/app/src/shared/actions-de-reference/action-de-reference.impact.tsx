'use client';

import { useLeviersPlaces } from '@/app/collectivites/priorisation-leviers/priorisation-leviers.view/data/use-leviers-places';
import { useLeviersPriorisation } from '@/app/collectivites/priorisation-leviers/priorisation-leviers.view/data/use-leviers-priorisation';
import { appLabels } from '@/app/labels/catalog';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import type { ActionDeReference } from '@tet/domain/shared';
import { VisibleWhen } from '@tet/ui';
import { JSX, useMemo } from 'react';
import { ActionDeReferenceInfoItem } from './action-de-reference-info.item';
import { type LevierImpact, toLevierImpacts } from './to-levier-impacts';

const toImpactText = ({
  impact,
  hasSeveralLeviers,
}: {
  impact: LevierImpact;
  hasSeveralLeviers: boolean;
}): string => {
  if (hasSeveralLeviers) {
    return appLabels.actionDeReferenceImpactValeurDuLevier({
      levierNom: impact.levierNom,
      score: impact.score,
    });
  }
  return appLabels.actionDeReferenceImpactValeur(impact.score);
};

const ActionDeReferenceImpactInfo = ({
  action,
}: {
  readonly action: ActionDeReference;
}): JSX.Element => {
  const { collectiviteId } = useCurrentCollectivite();
  const leviersQuery = useLeviersPriorisation(collectiviteId);
  const { places } = useLeviersPlaces(leviersQuery);
  const impacts = useMemo(
    () => toLevierImpacts({ places, levierIds: action.leviers }),
    [places, action.leviers]
  );

  return (
    <VisibleWhen condition={impacts.length > 0}>
      <ActionDeReferenceInfoItem
        icon="line-chart-line"
        label={appLabels.actionDeReferenceImpactInfo}
      >
        {impacts.map((impact) => (
          <span key={impact.levierId} className="block">
            {toImpactText({ impact, hasSeveralLeviers: impacts.length > 1 })}
          </span>
        ))}
      </ActionDeReferenceInfoItem>
    </VisibleWhen>
  );
};

export { ActionDeReferenceImpactInfo };
