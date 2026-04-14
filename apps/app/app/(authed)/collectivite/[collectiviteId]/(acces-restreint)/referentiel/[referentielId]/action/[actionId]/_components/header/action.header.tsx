'use client';

import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { useListMesurePilotes } from '@/app/referentiels/actions/use-mesure-pilotes';
import { useListMesureServicesPilotes } from '@/app/referentiels/actions/use-mesure-services-pilotes';
import ActionAuditStatut from '@/app/referentiels/audits/ActionAuditStatut';
import HeaderSticky from '@/app/ui/layout/HeaderSticky';
import { BadgeNiveauAcces } from '@/app/users/BadgeNiveauAcces';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Badge, cn, VisibleWhen } from '@tet/ui';
import classNames from 'classnames';
import { pluralize } from '../pluralize';
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

  const { data: pilotes } = useListMesurePilotes(action.actionId);
  const { data: services } = useListMesureServicesPilotes(action.actionId);

  const canEditReferentiel = hasCollectivitePermission('referentiels.mutate');

  return (
    <HeaderSticky
      render={({ isSticky }) => (
        <div className="w-full bg-grey-2 sticky top-0 shadow-none transition-all duration-100">
          <PreviousAndNextActionsLinks
            action={action}
            headerIsSticky={isSticky}
          />
          {/** Titre */}
          <div
            className={classNames(
              'flex flex-col-reverse  justify-between lg:flex-row lg:items-start',
              {
                'pt-3': !isSticky,
                'pt-1.5': isSticky,
              }
            )}
          >
            <h1
              className={classNames('mb-0 leading-tight', {
                'text-4xl mr-1': !isSticky,
                'text-2xl': isSticky,
              })}
            >
              {action.identifiant} {action.nom}
            </h1>
          </div>

          <div
            className={cn('flex flex-wrap gap-x-8 gap-y-2 justify-between', {
              'py-3': !isSticky,
              'py-1.5': isSticky,
            })}
          >
            <ActionBreadcrumb action={action} />
            <VisibleWhen condition={isSticky}>
              <RoleAndCollectiviteBadge />
            </VisibleWhen>
          </div>
          <div
            className={cn(
              'flex items-center flex-wrap gap-3 border-b border-primary-3 border-t',
              {
                'py-3': !isSticky,
                'py-1.5': isSticky,
              }
            )}
          >
            {/** Score | Informations | Options */}
            <Score action={action} />
            <VerticalDivider />
            <div className="max-w-24">
              <ActionAuditStatut action={action} className="lg:ml-auto -m-1" />
            </div>

            <VerticalDivider />
            <span className="text-primary-9 text-sm font-normal text-nowrap">
              {pluralize(action.childrenIds.length, 'sous-mesure')}
            </span>
            {action && (
              <Infos
                actionId={action.actionId}
                pilotes={pilotes}
                services={services}
                isReadOnly={!canEditReferentiel}
              />
            )}
          </div>
          <div className="flex items-center flex-wrap justify-left gap-3 py-3 border-b border-primary-3">
            <ActionSidePanelToolbar actionId={action.actionId} />
            <VerticalDivider />
            <DisplaySettingsButtons />
          </div>
        </div>
      )}
    />
  );
};
