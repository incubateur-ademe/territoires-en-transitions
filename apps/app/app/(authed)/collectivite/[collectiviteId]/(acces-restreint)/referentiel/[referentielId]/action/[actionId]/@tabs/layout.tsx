'use client';

import { ReactNode } from 'react';

import { CollectiviteProvider, useCollectiviteId } from '@/api/collectivites';
import { makeReferentielActionUrl } from '@/app/app/paths';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import {
  DEPRECATED_useActionDefinition,
  useAction,
  useActionId,
} from '@/app/referentiels/actions/action-context';
import { usePrevAndNextActionLinks } from '@/app/referentiels/actions/use-prev-and-next-action-links';
import { ActionAuditDetail } from '@/app/referentiels/audits/ActionAuditDetail';
import { useActionPreuvesCount } from '@/app/referentiels/preuves/usePreuves';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import ScrollTopButton from '@/app/ui/buttons/ScrollTopButton';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Button } from '@/ui';
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@/ui/design-system/Tabs/Tabs.next';
import ActionCommentsPanel from '../_components/comments/action-comments.panel';
import { ActionHeader } from '../_components/header/action.header';

export default function Layout({ children }: { children: ReactNode }) {
  const actionDefinition = DEPRECATED_useActionDefinition();

  if (!actionDefinition) {
    return <SpinnerLoader containerClassName="m-auto" />;
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

  const { data: action, isLoading } = useAction();

  const { prevActionLink, nextActionLink } = usePrevAndNextActionLinks(
    actionDefinition.id
  );

  const preuvesCount = useActionPreuvesCount(actionDefinition.id);

  const { panel, setPanel } = useSidePanel();

  if (isLoading) {
    return <SpinnerLoader containerClassName="grow flex" className="m-auto" />;
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

            {/* {audit && auditStatut && (
                      <TabsTab
                        href={makeReferentielActionUrl({
                          collectiviteId,
                          referentielId,
                          actionId,
                          actionVue: 'audit',
                        })}
                        label="Audit"
                        icon="list-check-3"
                      />
                    )} */}

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

          <div className="flex justify-center items-center pl-4">
            <Button
              dataTest="ActionDiscussionsButton"
              icon="question-answer-line"
              onClick={() => {
                if (panel.isOpen) {
                  setPanel({ type: 'close' });
                } else {
                  setPanel({
                    type: 'open',
                    isPersistentWithNextPath: (pathname) =>
                      pathname === nextActionLink ||
                      pathname === prevActionLink,
                    title: 'Commentaires',
                    content: (
                      <CollectiviteProvider collectiviteId={collectiviteId}>
                        <ActionCommentsPanel actionId={actionId} />
                      </CollectiviteProvider>
                    ),
                  });
                }
              }}
              title="Commentaires"
              variant="outlined"
              size="xs"
              className="ml-auto"
            />
          </div>
        </div>

        <TabsPanel>{children}</TabsPanel>
      </Tabs>
      <ScrollTopButton className="mt-8" />
    </div>
  );
}
