'use client';

import { ReactNode } from 'react';

import { makeReferentielActionUrl } from '@/app/app/paths';
import { useAction } from '@/app/referentiels/actions/action-context';
import { useCommentPanel } from '@/app/referentiels/actions/comments/hooks/use-comment-panel';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { ActionAuditDetail } from '@/app/referentiels/audits/ActionAuditDetail';
import { useActionPreuvesCount } from '@/app/referentiels/preuves/usePreuves';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import ScrollTopButton from '@/app/ui/buttons/ScrollTopButton';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button } from '@tet/ui';
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@tet/ui/design-system/TabsNext/index';
import { ActionHeader } from '../_components/header/action.header';

export default function Layout({ children }: { children: ReactNode }) {
  const action = useAction();

  if (!action) {
    return <SpinnerLoader className="m-auto" />;
  }

  return <ActionLayout action={action}>{children}</ActionLayout>;
}

function ActionLayout({
  action,
  children,
}: {
  action: ActionListItem;
  children: ReactNode;
}) {
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const referentielId = useReferentielId();

  const { openCommentPanel, closeCommentPanel, panel } = useCommentPanel();

  const { actionId } = action;

  const preuvesCount = useActionPreuvesCount(actionId);

  const canReadComments = hasCollectivitePermission(
    'referentiels.discussions.read'
  );

  return (
    <div
      data-test={`Action-${action.identifiant}`}
      className="grow flex flex-col"
    >
      <ActionHeader action={action} />

      <ActionAuditDetail action={action} />
      <Tabs className="grow flex flex-col">
        <div className="flex justify-between">
          <TabsList className="!justify-start pl-0 mt-6 flex-nowrap overflow-x-auto">
            <TabsTab
              href={makeReferentielActionUrl({
                collectiviteId,
                referentielId,
                actionId,
              })}
              label="Suivi de la mesure"
              icon="seedling-line"
            />

            <TabsTab
              href={makeReferentielActionUrl({
                collectiviteId,
                referentielId,
                actionId,
                actionVue: 'documents',
              })}
              label={`Documents${
                preuvesCount !== undefined ? ` (${preuvesCount})` : ''
              }`}
              icon="file-line"
            />

            <TabsTab
              href={makeReferentielActionUrl({
                collectiviteId,
                referentielId,
                actionId,
                actionVue: 'indicateurs',
              })}
              label="Indicateurs"
              icon="line-chart-line"
            />

            <TabsTab
              href={makeReferentielActionUrl({
                collectiviteId,
                referentielId,
                actionId,
                actionVue: 'fiches',
              })}
              label="Actions"
              icon="article-line"
            />

            <TabsTab
              href={makeReferentielActionUrl({
                collectiviteId,
                referentielId,
                actionId,
                actionVue: 'historique',
              })}
              label="Historique"
              icon="time-line"
            />

            <TabsTab
              href={makeReferentielActionUrl({
                collectiviteId,
                referentielId,
                actionId,
                actionVue: 'informations',
              })}
              label="Informations sur la mesure"
              icon="information-line"
            />
          </TabsList>

          {canReadComments && (
            <div className="flex justify-center items-center pl-4">
              <Button
                dataTest="ActionDiscussionsButton"
                icon="question-answer-line"
                onClick={() => {
                  if (panel.isOpen) {
                    closeCommentPanel();
                  } else {
                    openCommentPanel({ action });
                  }
                }}
                title="Commentaires"
                variant="outlined"
                size="xs"
                className="ml-auto"
              />
            </div>
          )}
        </div>

        <TabsPanel>{children}</TabsPanel>
      </Tabs>
      <ScrollTopButton className="mt-8" />
    </div>
  );
}
