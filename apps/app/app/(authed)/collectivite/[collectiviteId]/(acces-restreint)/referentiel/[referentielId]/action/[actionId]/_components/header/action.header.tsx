'use client';

import { appLabels } from '@/app/labels/catalog';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import ActionAuditStatut from '@/app/referentiels/audits/ActionAuditStatut';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { isNewReferentiel as isNewReferentielUtils } from '@tet/domain/referentiels';
import { cn, PageHeader } from '@tet/ui';
import { useState } from 'react';
import { ActionSidePanelToolbar } from './action-side-panel-toolbar';
import { ActionBreadcrumb } from './breadcrumb/action.breadcrumb';
import { DisplaySettingsButtons } from './display-settings-buttons';
import { Infos } from './infos';
import { PreviousAndNextActionsLinks } from './previous-and-next-actions.links';
import { Score } from './score';
import { VerticalDivider } from './vertical-divider';

export const ActionHeader = ({ action }: { action: ActionListItem }) => {
  const { hasCollectivitePermission } = useCurrentCollectivite();

  const canEditReferentiel = hasCollectivitePermission('referentiels.mutate');

  const [isSticky, setIsSticky] = useState(false);
  const isNewReferentiel = isNewReferentielUtils(action.referentielId);

  return (
    <PageHeader sticky onStickyChange={setIsSticky}>
      <PageHeader.Navigation label="Navigation entre mesures">
        <PreviousAndNextActionsLinks
          action={action}
          headerIsSticky={isSticky}
        />
      </PageHeader.Navigation>

      <PageHeader.Title>
        {action.identifiant} {action.nom}
      </PageHeader.Title>

      <PageHeader.Subtitle>
        <ActionBreadcrumb action={action} />
      </PageHeader.Subtitle>

      <PageHeader.Metadata>
        <div className="flex items-center flex-wrap gap-3">
          <Score action={action} />
          <ActionAuditStatut action={action} />
          <VerticalDivider />
          {action.childrenIds.length !== 1 && (
            <span className="text-primary-9 text-sm font-normal text-nowrap">
              {appLabels.sousMesure({ count: action.childrenIds.length })}
            </span>
          )}
          <div className={cn({ 'max-2xl:hidden': isSticky })}>
            <Infos
              actionId={action.actionId}
              pilotes={action.pilotes}
              services={action.services}
              isReadOnly={!canEditReferentiel}
            />
          </div>
        </div>
      </PageHeader.Metadata>

      <PageHeader.Metadata>
        <div className="flex items-center flex-wrap justify-left gap-3">
          <ActionSidePanelToolbar actionId={action.actionId} />
          {!isNewReferentiel && (
            <>
              <VerticalDivider />
              <DisplaySettingsButtons />
            </>
          )}
        </div>
      </PageHeader.Metadata>
    </PageHeader>
  );
};
