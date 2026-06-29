'use client';

import { referentielToName } from '@/app/app/labels';
import { appLabels } from '@/app/labels/catalog';
import {
  ActionListItem,
  useListActions,
} from '@/app/referentiels/actions/use-list-actions';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import { ScoreRatioBadge } from '@/app/referentiels/scores/score.ratio-badge';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ActionTypeEnum, ReferentielId } from '@tet/domain/referentiels';
import { PageHeader } from '@tet/ui';
import { ReactElement } from 'react';
import { RoleMesures } from '../checklist-view-model';
import { useChecklist } from '../checklist.context';
import { ReferentielMenuButton } from './referentiel-menu.button';
import { ReferentsLine } from './referents-line';

const ReferentielScoreLine = ({
  action,
}: {
  action: ActionListItem;
}): ReactElement => (
  <div className="flex max-sm:flex-col sm:items-center gap-4">
    <ScoreProgressBar className="grow" action={action} />
    <ScoreRatioBadge action={action} className="sm:ml-auto" />
  </div>
);

const ChecklistPageHeaderView = ({
  referentielId,
  collectiviteId,
  referentiel,
  roleMesures,
}: {
  referentielId: ReferentielId;
  collectiviteId: number;
  referentiel: ActionListItem | undefined;
  roleMesures: RoleMesures | null;
}): ReactElement => (
  <PageHeader>
    <PageHeader.Title>
      {appLabels.referentiel} {referentielToName[referentielId]}
    </PageHeader.Title>
    <PageHeader.Actions>
      <ReferentielMenuButton
        referentielId={referentielId}
        collectiviteId={collectiviteId}
      />
    </PageHeader.Actions>
    <PageHeader.Metadata>
      <ReferentsLine roleMesures={roleMesures} />
      {referentiel !== undefined && <ReferentielScoreLine action={referentiel} />}
    </PageHeader.Metadata>
  </PageHeader>
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

  return (
    <ChecklistPageHeaderView
      referentielId={referentielId}
      collectiviteId={collectiviteId}
      referentiel={actions[0]}
      roleMesures={parcours?.roleMesures ?? null}
    />
  );
};
