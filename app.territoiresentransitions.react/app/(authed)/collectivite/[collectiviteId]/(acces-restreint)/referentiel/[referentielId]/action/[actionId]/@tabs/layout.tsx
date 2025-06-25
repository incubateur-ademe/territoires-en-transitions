'use client';

import { useCollectiviteId } from '@/api/collectivites';
import CollectivitePageLayout from '@/app/app/pages/collectivite/CollectivitePageLayout/CollectivitePageLayout';
import { makeReferentielActionUrl } from '@/app/app/paths';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import {
  DEPRECATED_useActionDefinition,
  useAction,
  useActionId,
} from '@/app/referentiels/actions/action-context';
import { usePrevAndNextActionLinks } from '@/app/referentiels/actions/use-prev-and-next-action-links';
import { useActionAuditStatut } from '@/app/referentiels/audits/useActionAuditStatut';
import { useAudit } from '@/app/referentiels/audits/useAudit';
import { useActionPreuvesCount } from '@/app/referentiels/preuves/usePreuves';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import ScrollTopButton from '@/app/ui/buttons/ScrollTopButton';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Button } from '@/ui';
import PageContainer from '@/ui/components/layout/page-container';
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@/ui/design-system/Tabs/Tabs.next';
import { ReactNode, useState } from 'react';
import ActionCommentsPanel from '../_components/comments/action-comments.panel';
import { ActionHeader } from '../_components/header/action.header';

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

  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);

  const { data: action, isLoading } = useAction();

  const { prevActionLink, nextActionLink } = usePrevAndNextActionLinks(
    actionDefinition.id
  );

  const preuvesCount = useActionPreuvesCount(actionDefinition.id);
  const { data: audit } = useAudit();
  const { data: auditStatut } = useActionAuditStatut(actionDefinition);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <SpinnerLoader />
      </div>
    );
  }

  if (!action) return null;

  return (
    <PageContainer
      dataTest={`Action-${actionDefinition.identifiant}`}
      innerContainerClassName="px-4 !pt-0"
    >
      <CollectivitePageLayout className="!px-0">
        <ActionHeader
          actionDefinition={actionDefinition}
          action={action}
          nextActionLink={nextActionLink}
          prevActionLink={prevActionLink}
        />

        <Tabs>
          <div className="flex justify-between">
            <TabsList className="!justify-start pl-0 mt-6 flex-nowrap">
              <TabsTab
                href={makeReferentielActionUrl({
                  collectiviteId,
                  referentielId,
                  actionId,
                })}
                label="Suivi de la mesure"
                icon="seedling-line"
              />

              {audit && auditStatut && (
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
              )}

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

            <div className="flex justify-center items-center">
              <Button
                dataTest="ActionDiscussionsButton"
                icon="question-answer-line"
                onClick={() => setIsCommentPanelOpen((prevState) => !prevState)}
                title="Commentaires"
                variant="outlined"
                size="xs"
                className="ml-auto"
              />
            </div>
          </div>

          <TabsPanel>{children}</TabsPanel>
        </Tabs>

        {/** Action précédente / suivante */}
        <div className="flex justify-end mt-8 gap-4">
          {prevActionLink && (
            <Button
              variant="outlined"
              icon="arrow-left-line"
              size="sm"
              href={prevActionLink}
            >
              Mesure précédente
            </Button>
          )}
          {nextActionLink && (
            <Button
              icon="arrow-right-line"
              iconPosition="right"
              size="sm"
              href={nextActionLink}
            >
              Mesure suivante
            </Button>
          )}
        </div>

        <ScrollTopButton className="mt-8" />

        {!isLoading && actionDefinition.id && (
          <ActionCommentsPanel
            isOpen={isCommentPanelOpen}
            setIsOpen={setIsCommentPanelOpen}
            actionId={actionDefinition.id}
          />
        )}
      </CollectivitePageLayout>
    </PageContainer>
  );
}
