import HistoriqueListe from '@/app/app/pages/collectivite/Historique/HistoriqueListe';
import { useFilteredIndicateurDefinitions } from '@/app/app/pages/collectivite/Indicateurs/lists/useFilteredIndicateurDefinitions';
import {
  ActionTabParamOption,
  makeReferentielActionUrl,
} from '@/app/app/paths';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { FichesActionLiees } from '@/app/referentiels/action.show/FichesActionLiees';
import IndicateurChartsGrid from '@/app/referentiels/action.show/IndicateurChartsGrid';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import ActionDetail from '@/app/referentiels/actions/action-detail';
import { DownloadDocs } from '@/app/referentiels/actions/action-documents.download-button';
import ActionPreuvePanel from '@/app/referentiels/actions/action-preuve.panel';
import { ActionBreadcrumb } from '@/app/referentiels/actions/action.breadcrumb';
import { ActionBottomNav } from '@/app/referentiels/actions/action.nav';
import { usePrevAndNextActionLinks } from '@/app/referentiels/actions/use-prev-and-next-action-links';
import { useScoreRealise } from '@/app/referentiels/actions/useScoreRealise';
import { ActionAuditDetail } from '@/app/referentiels/audits/ActionAuditDetail';
import ActionAuditStatut from '@/app/referentiels/audits/ActionAuditStatut';
import { useShowDescIntoInfoPanel } from '@/app/referentiels/audits/useAudit';
import { useCycleLabellisation } from '@/app/referentiels/labellisations/useCycleLabellisation';
import { useActionPreuvesCount } from '@/app/referentiels/preuves/usePreuves';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useAction } from '@/app/referentiels/use-snapshot';
import ScrollTopButton from '@/app/ui/buttons/ScrollTopButton';
import { Tab, Tabs } from '@/app/ui/shared/Tabs';
import { addTargetToContentAnchors } from '@/app/utils/content';
import { Alert } from '@/ui';
import PageContainer from '@/ui/components/layout/page-container';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ActionHeader } from './action.header';

// index des onglets de la page Action
const TABS_INDEX: Record<ActionTabParamOption, number> = {
  suivi: 0,
  preuves: 1,
  indicateurs: 2,
  fiches: 3,
  historique: 4,
};

const ActionShow = ({
  actionDefinition,
}: {
  actionDefinition: ActionDefinitionSummary;
}) => {
  const { actionTab } = useParams<{
    actionTab?: ActionTabParamOption;
  }>();

  const router = useRouter();
  const collectivite = useCurrentCollectivite();
  const collectiviteId = collectivite?.collectiviteId;
  const referentielId = useReferentielId();
  const { prevActionLink, nextActionLink } = usePrevAndNextActionLinks(
    actionDefinition.id
  );
  const preuvesCount = useActionPreuvesCount(actionDefinition.id);
  const showDescIntoInfoPanel = useShowDescIntoInfoPanel();

  const { data: indicateursLies } = useFilteredIndicateurDefinitions({
    filtre: {
      actionId: actionDefinition.id,
      withChildren: true,
    },
  });

  const DEPRECATED_actionScores = useScoreRealise(actionDefinition);
  const NEW_action = useAction(actionDefinition.id);

  const { status: auditStatus } = useCycleLabellisation(
    actionDefinition.referentiel
  );

  if (!actionDefinition || !collectivite) {
    return <Link href="./referentiels" />;
  }

  const activeTab = actionTab ? TABS_INDEX[actionTab] : TABS_INDEX['suivi'];

  // le contenu de l'onglet Indicateurs n'est pas affiché si la collectivité est
  // en accès restreint
  const noIndicateursTab =
    collectivite.accesRestreint && collectivite.niveauAcces === null;

  // synchronise l'url lors du passage d'un onglet à l'autre
  const handleChange = (activeTab: number) => {
    // recherche le nom de la vue correspondant à l'onglet courant
    const view = Object.entries(TABS_INDEX).find(
      ([, index]) => index === activeTab
    );
    const name = view?.[0] as ActionTabParamOption;

    // met à jour l'url
    if (collectiviteId && name && name !== actionTab) {
      router.replace(
        makeReferentielActionUrl({
          collectiviteId,
          referentielId,
          actionVue: name,
          actionId: actionDefinition.id,
        })
      );
    }
  };

  if (!actionDefinition || !collectiviteId || !NEW_action) {
    return <Link href="./referentiels" />;
  }

  return (
    <PageContainer
      dataTest={`Action-${actionDefinition.identifiant}`}
      bgColor="white"
    >
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
      <Tabs
        defaultActiveTab={activeTab}
        onChange={handleChange}
        className="fr-mt-9v bg-white"
      >
        <Tab label="Suivi de l'action" icon="seedling">
          <ActionDetail action={actionDefinition} auditStatus={auditStatus} />
        </Tab>
        <Tab
          label={`Documents${
            preuvesCount !== undefined ? ` (${preuvesCount})` : ''
          }`}
          icon="file"
        >
          {activeTab === TABS_INDEX['preuves'] ? (
            <section>
              <ActionPreuvePanel
                withSubActions
                showWarning
                action={actionDefinition}
              />
              <DownloadDocs action={actionDefinition} />
            </section>
          ) : (
            '...'
          )}
        </Tab>
        <Tab label="Indicateurs" icon="line-chart">
          {activeTab === TABS_INDEX['indicateurs'] && !noIndicateursTab ? (
            <section>
              {indicateursLies?.length === 0 ? (
                <p>{"Cette action ne comporte pas d'indicateur"}</p>
              ) : (
                <IndicateurChartsGrid
                  definitions={indicateursLies}
                  view={referentielId}
                />
              )}
            </section>
          ) : (
            '...'
          )}
        </Tab>
        <Tab label="Fiches action" icon="todo">
          {activeTab === TABS_INDEX['fiches'] ? (
            <FichesActionLiees actionId={actionDefinition.id} />
          ) : (
            '...'
          )}
        </Tab>
        <Tab label="Historique" icon="history">
          {activeTab === TABS_INDEX['historique'] ? (
            <HistoriqueListe actionId={actionDefinition.id} />
          ) : (
            '...'
          )}
        </Tab>
      </Tabs>
      <ActionBottomNav
        prevActionLink={prevActionLink}
        nextActionLink={nextActionLink}
      />
      <ScrollTopButton className="mt-8" />
    </PageContainer>
  );
};

export default ActionShow;
