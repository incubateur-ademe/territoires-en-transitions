'use client';

import { ReactNode } from 'react';

import { makeReferentielActionUrl } from '@/app/app/paths';
import {
  DEPRECATED_useActionDefinition,
  useActionId,
} from '@/app/referentiels/actions/action-context';
import { ActionAuditDetail } from '@/app/referentiels/audits/ActionAuditDetail';
import { useActionPreuvesCount } from '@/app/referentiels/preuves/usePreuves';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import ScrollTopButton from '@/app/ui/buttons/ScrollTopButton';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useIsVisitor } from '@/app/users/authorizations/use-is-visitor';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Button } from '@tet/ui';
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@tet/ui/design-system/TabsNext/index';
import { useCommentPanel } from '../_components/comments/hooks/use-comment-panel';
import { ActionHeader } from '../_components/header/action.header';

export default function Layout({ children }: { children: ReactNode }) {
  const actionDefinition = DEPRECATED_useActionDefinition();

  if (!actionDefinition) {
    return <SpinnerLoader className="m-auto" />;
  }

  return (
    <ActionLayout actionDefinition={actionDefinition}>{children}</ActionLayout>
  );
}

function ActionLayout({
  actionDefinition,
  children,
}: {
  actionDefinition: ActionDefinitionSummary;
  children: ReactNode;
}) {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();
  const actionId = useActionId();
  const isVisitor = useIsVisitor();

  const { openPanel, closePanel, action, isPending, panel } = useCommentPanel(
    referentielId,
    actionId
  );

  const preuvesCount = useActionPreuvesCount(actionDefinition.id);

  if (isPending) {
    return <SpinnerLoader className="m-auto" />;
  }

  if (!action) return null;

  return (
    <div
      data-test={`Action-${actionDefinition.identifiant}`}
      className="grow flex flex-col"
    >
      <ActionHeader actionDefinition={actionDefinition} action={action} />

      <ActionAuditDetail action={actionDefinition} />
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
              label="Fiches action"
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

          {!isVisitor && (
            <div className="flex justify-center items-center pl-4">
              <Button
                dataTest="ActionDiscussionsButton"
                icon="question-answer-line"
                onClick={() => {
                  if (panel.isOpen) {
                    closePanel();
                  } else {
                    openPanel(actionId);
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
