'use client';

import { appLabels } from '@/app/labels/catalog';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import ActionAuditStatut from '@/app/referentiels/audits/ActionAuditStatut';
import { BadgeNiveauAcces } from '@/app/users/BadgeNiveauAcces';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Badge, PageHeader, VisibleWhen } from '@tet/ui';
import { useState } from 'react';
import { ActionSidePanelToolbar } from './action-side-panel-toolbar';
import { ActionBreadcrumb } from './breadcrumb/action.breadcrumb';
import { DisplaySettingsButtons } from './display-settings-buttons';
import { Infos } from './infos';
import { PreviousAndNextActionsLinks } from './previous-and-next-actions.links';
import { Score } from './score';
import { VerticalDivider } from './vertical-divider';

const RoleAndCollectiviteBadge = () => {
  const { nom: currentCollectiviteName, role } = useCurrentCollectivite();

  return (
    <div className="shrink-0 flex self-center border-[0.5px] border-info-3 rounded-md">
      <BadgeNiveauAcces acces={role} className="!rounded-r-none border-none" />
      <Badge
        title={currentCollectiviteName}
        variant={role === null ? 'new' : 'info'}
        type="outlined"
        uppercase={false}
        className="!rounded-l-none border-none"
        size="xs"
        trim={false}
      />
    </div>
  );
};

export const ActionHeader = ({ action }: { action: ActionListItem }) => {
  const { hasCollectivitePermission } = useCurrentCollectivite();

  const canEditReferentiel = hasCollectivitePermission('referentiels.mutate');

  const [isSticky, setIsSticky] = useState(false);

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
        <div className="flex flex-wrap gap-x-8 gap-y-2 justify-between">
          <ActionBreadcrumb action={action} />
          <VisibleWhen condition={isSticky}>
            <RoleAndCollectiviteBadge />
          </VisibleWhen>
        </div>
      </PageHeader.Subtitle>

      <PageHeader.Metadata>
        <div className="flex items-center flex-wrap gap-3">
          <Score action={action} />
          <VerticalDivider />
          <div className="max-w-24">
            <ActionAuditStatut action={action} className="lg:ml-auto -m-1" />
          </div>
          <VerticalDivider />
          {action.childrenIds.length !== 1 && (
            <span className="text-primary-9 text-sm font-normal text-nowrap">
              {appLabels.sousMesure({ count: action.childrenIds.length })}
            </span>
          )}
          <Infos
            actionId={action.actionId}
            pilotes={action.pilotes}
            services={action.services}
            isReadOnly={!canEditReferentiel}
          />
        </div>
      </PageHeader.Metadata>

      <PageHeader.Metadata>
        <div className="flex items-center flex-wrap justify-left gap-3">
          <ActionSidePanelToolbar actionId={action.actionId} />
          <VerticalDivider />
          <DisplaySettingsButtons />
        </div>
      </PageHeader.Metadata>
    </PageHeader>
  );
};
