'use client';

import CollectivitePageLayout from '@/app/app/pages/collectivite/CollectivitePageLayout/CollectivitePageLayout';
import { makeReferentielActionUrl } from '@/app/app/paths';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { useScoreRealise } from '@/app/referentiels/actions/DEPRECATED_useScoreRealise';
import {
  DEPRECATED_useActionDefinition,
  useAction,
  useActionId,
} from '@/app/referentiels/actions/action-context';
import { ActionBreadcrumb } from '@/app/referentiels/actions/action.breadcrumb';
import { ActionBottomNav } from '@/app/referentiels/actions/action.nav';
import { usePrevAndNextActionLinks } from '@/app/referentiels/actions/use-prev-and-next-action-links';
import { ActionAuditDetail } from '@/app/referentiels/audits/ActionAuditDetail';
import ActionAuditStatut from '@/app/referentiels/audits/ActionAuditStatut';
import { useShowDescIntoInfoPanel } from '@/app/referentiels/audits/useAudit';
import { useActionPreuvesCount } from '@/app/referentiels/preuves/usePreuves';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import ScrollTopButton from '@/app/ui/buttons/ScrollTopButton';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { addTargetToContentAnchors } from '@/app/utils/content';
import { Alert } from '@/ui';
import PageContainer from '@/ui/components/layout/page-container';
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@/ui/design-system/Tabs/Tabs.next';
import { ReactNode } from 'react';
import { ActionHeader } from './action.header';

export default function Layout({ children }: { children: ReactNode }) {
  const actionDefinition = DEPRECATED_useActionDefinition();

  if (!actionDefinition) {
    return (
      <PageContainer>
        <SpinnerLoader />
      </PageContainer>
    );
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

  const DEPRECATED_actionScores = useScoreRealise(actionDefinition);
  const { data: NEW_action } = useAction();

  const showDescIntoInfoPanel = useShowDescIntoInfoPanel();

  const { prevActionLink, nextActionLink } = usePrevAndNextActionLinks(
    actionDefinition.id
  );

  const preuvesCount = useActionPreuvesCount(actionDefinition.id);

  return (
    <PageContainer
      dataTest={`Action-${actionDefinition.identifiant}`}
      innerContainerClassName="!pt-0"
    >
      <CollectivitePageLayout>
        <ActionHeader
          actionDefinition={actionDefinition}
          DEPRECATED_actionScore={DEPRECATED_actionScores[actionDefinition.id]}
          action={NEW_action}
          nextActionLink={nextActionLink}
          prevActionLink={prevActionLink}
        />

        <ActionBreadcrumb action={actionDefinition} />
        <ActionAuditStatut action={actionDefinition} />
        <ActionAuditDetail action={actionDefinition} />

        {!showDescIntoInfoPanel && (
          <Alert
            className="mt-9"
            description={
              <div
                className="htmlContent"
                dangerouslySetInnerHTML={{
                  __html: addTargetToContentAnchors(
                    actionDefinition.description || ''
                  ),
                }}
              />
            }
          />
        )}

        <Tabs tabsListClassName="!justify-start pl-0 mt-6 flex-nowrap ">
          <TabsList>
            <TabsTab
              href={makeReferentielActionUrl({
                collectiviteId,
                referentielId,
                actionId,
              })}
              label="Suivi de l'action"
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
              icon="todo-line"
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
          </TabsList>

          <TabsPanel>{children}</TabsPanel>
        </Tabs>

        <ActionBottomNav
          prevActionLink={prevActionLink}
          nextActionLink={nextActionLink}
        />

        <ScrollTopButton className="mt-8" />
      </CollectivitePageLayout>
    </PageContainer>
  );
}
