'use client';

import { useLeviersPlaces } from '@/app/collectivites/priorisation-leviers/priorisation-leviers.view/data/use-leviers-places';
import { useLeviersPriorisation } from '@/app/collectivites/priorisation-leviers/priorisation-leviers.view/data/use-leviers-priorisation';
import { appLabels } from '@/app/labels/catalog';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import type { ActionDeReference } from '@tet/domain/shared';
import { VisibleWhen } from '@tet/ui';
import { JSX, useMemo } from 'react';
import { ActionDeReferenceInfoItem } from './action-de-reference-info.item';
import { toLevierImpactLines, toLevierImpacts } from './to-levier-impacts';

const ActionDeReferenceImpactInfo = ({
  action,
}: {
  readonly action: ActionDeReference;
}): JSX.Element => {
  const { collectiviteId } = useCurrentCollectivite();
  const leviersQuery = useLeviersPriorisation(collectiviteId);
  const { places } = useLeviersPlaces(leviersQuery);
  const lines = useMemo(
    () =>
      toLevierImpactLines({
        impacts: toLevierImpacts({ places, levierIds: action.leviers }),
        actionLevierCount: action.leviers.length,
      }),
    [places, action.leviers]
  );

  return (
    <VisibleWhen condition={lines.length > 0}>
      <ActionDeReferenceInfoItem
        icon="line-chart-line"
        label={appLabels.actionDeReferenceImpactInfo}
      >
        {lines.map(({ levierId, text }) => (
          <span key={levierId} className="block">
            {text}
          </span>
        ))}
      </ActionDeReferenceInfoItem>
    </VisibleWhen>
  );
};

export { ActionDeReferenceImpactInfo };
