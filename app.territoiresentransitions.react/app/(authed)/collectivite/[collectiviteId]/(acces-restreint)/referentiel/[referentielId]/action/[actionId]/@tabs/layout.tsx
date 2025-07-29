'use client';

import { ReactNode, useState } from 'react';

import { useCollectiviteId } from '@/api/collectivites';
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
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Button } from '@/ui';
import PageContainer from '@/ui/components/layout/page-container';
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@/ui/design-system/Tabs/Tabs.next';
import classNames from 'classnames';
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

  /**
   * Permet de faire matcher la largeur du panneau avec son emplacement dans la grille.
   * On doit faire cela pour que le panneau de commentaires ait une largeur fixe et
   * ne se resize pas avec la grille.
   * Je fais comme cela car on ne peut pas utliser `w-[${panelWidthDesktop}]` avec tailwind,
   * bien modifier `gridOpen` si la largeur du panneau change en mobile ou desktop.
   *
   * Comme l'emplacement du panneau dans la grille change en largeur avec une transition,
   * si l'on ne fait pas cela, alors les champs textarea des commentaires se resize aussi.
   * Cependant comme ils sont `autoResize` et que la hauteur d'origine est calculé au mount,
   * s'il y a un placeholder et que la largeur part de 0 alors cette hauteur d'origine sera beaucoup trop grande
   * car au début, il n'y aura qu'un seul caractère par ligne.
   */
  const gridPanelClass = {
    mobile: 'w-[100vw]',
    desktop: 'lg:w-[32rem]',
    gridOpen: '!grid-cols-[0_100vw] md:!grid-cols-[minmax(0,_90rem)_32rem]',
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <SpinnerLoader />
      </div>
    );
  }

  if (!action) return null;

  return (
    <div className="flex bg-grey-2">
      <div
        className={classNames(
          'grid grid-cols-[minmax(0,_90rem)_0] mx-auto transition-all duration-500',
          { [gridPanelClass.gridOpen]: isCommentPanelOpen }
        )}
      >
        {/** Main page content */}
        <div
          data-test={`Action-${actionDefinition.identifiant}`}
          className={classNames('px-4 py-12', {
            'max-md:invisible': isCommentPanelOpen,
          })}
        >
          <ActionHeader
            actionDefinition={actionDefinition}
            action={action}
            nextActionLink={nextActionLink}
            prevActionLink={prevActionLink}
          />

          <ActionAuditDetail action={actionDefinition} />

          <Tabs>
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
                  onClick={() =>
                    setIsCommentPanelOpen((prevState) => !prevState)
                  }
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
          <div className="flex justify-between mt-8 gap-4">
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
                className="ml-auto"
                href={nextActionLink}
              >
                Mesure suivante
              </Button>
            )}
          </div>

          <ScrollTopButton className="mt-8" />
        </div>

        {/** Side Panel */}
        {!isLoading && actionDefinition.id && isCommentPanelOpen && (
          <div
            className={classNames(
              `flex ${gridPanelClass.mobile} ${gridPanelClass.desktop}`
            )}
          >
            <ActionCommentsPanel
              setIsOpen={setIsCommentPanelOpen}
              actionId={actionDefinition.id}
            />
          </div>
        )}
      </div>
    </div>
  );
}
