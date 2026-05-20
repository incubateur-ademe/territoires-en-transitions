'use client';

import { referentielToName } from '@/app/app/labels';
import { appLabels } from '@/app/labels/catalog';
import { useListActions } from '@/app/referentiels/actions/use-list-actions';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import { ScoreRatioBadge } from '@/app/referentiels/scores/score.ratio-badge';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ActionTypeEnum, ReferentielId } from '@tet/domain/referentiels';
import { Divider } from '@tet/ui';
import { ReactElement } from 'react';
import { useChecklist } from '../checklist.context';
import { ReferentielMenuButton } from './referentiel-menu.button';
import { RoleMesuresLine } from './role-mesures-line';

const Title = ({
  referentielId,
}: {
  referentielId: ReferentielId;
}): ReactElement => (
  <h1 className="mb-0 text-2xl">
    {appLabels.referentiel} {referentielToName[referentielId]}
  </h1>
);

export const ChecklistPageHeader = ({
  referentielId,
}: {
  referentielId: ReferentielId;
}): ReactElement => {
  const { collectiviteId } = useCurrentCollectivite();
  const { parcours } = useChecklist();
  const { data: actions } = useListActions({
    referentielIds: [referentielId],
    actionTypes: [ActionTypeEnum.REFERENTIEL],
  });
  const referentiel = actions[0];

  const roleMesures = parcours?.roleMesures ?? null;

  return (
    <>
      <div className="flex max-md:flex-col md:items-center md:justify-between gap-4">
        <Title referentielId={referentielId} />
        <ReferentielMenuButton
          referentielId={referentielId}
          collectiviteId={collectiviteId}
        />
      </div>

      <Divider className="mb-4" />
      {roleMesures && <RoleMesuresLine roleMesures={roleMesures} />}

      {referentiel && (
        <div className="flex max-sm:flex-col sm:items-center gap-4">
          <ScoreProgressBar className="grow" action={referentiel} />
          <ScoreRatioBadge action={referentiel} className="sm:ml-auto" />
        </div>
      )}
    </>
  );
};
