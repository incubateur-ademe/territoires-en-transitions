import HistoriqueListe from '@/app/app/pages/collectivite/Historique/HistoriqueListe';
import { OrientationQuickNav } from '@/app/app/pages/collectivite/Referentiels/QuickNav';
import {
  ActionVueParamOption,
  makeCollectiviteActionUrl,
  ReferentielParamOption,
} from '@/app/app/paths';
import { ActionDefinitionSummary } from '@/app/core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import { useActionVue, useReferentielId } from '@/app/core-logic/hooks/params';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import ScrollTopButton from '@/app/ui/buttons/ScrollTopButton';
import ActionPreuvePanel from '@/app/ui/shared/actions/ActionPreuvePanel/ActionPreuvePanel';
import { useActionPreuvesCount } from '@/app/ui/shared/preuves/Bibliotheque/usePreuves';
import { Tab, Tabs } from '@/app/ui/shared/Tabs';
import { addTargetToContentAnchors } from '@/app/utils/content';
import { Alert } from '@/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ActionAuditDetail } from '../Audit/ActionAuditDetail';
import ActionAuditStatut from '../Audit/ActionAuditStatut';
import { useShowDescIntoInfoPanel } from '../Audit/useAudit';
import { useScoreRealise } from '../EtatDesLieux/Referentiel/data/useScoreRealise';
import ActionFollowUp from '../EtatDesLieux/Referentiel/SuiviAction/ActionFollowUp';
import { useFilteredIndicateurDefinitions } from '../Indicateurs/lists/useFilteredIndicateurDefinitions';
import { useCycleLabellisation } from '../ParcoursLabellisation/useCycleLabellisation';
import { ActionHeader } from './ActionHeader';
import { ActionBottomNav } from './ActionNav';
import { DownloadDocs } from './DownloadDocs';
import { FichesActionLiees } from './FichesActionLiees';
import IndicateurChartsGrid from './IndicateurChartsGrid';
import { usePrevAndNextActionLinks } from './usePrevAndNextActionLinks';
import PageContainer from '@/ui/components/layout/page-container';

// index des onglets de la page Action
const TABS_INDEX: Record<ActionVueParamOption, number> = {
  suivi: 0,
  preuves: 1,
  indicateurs: 2,
  fiches: 3,
  historique: 4,
};

const Action = ({ action }: { action: ActionDefinitionSummary }) => {
  const actionVue = useActionVue();
  const router = useRouter();
  const collectivite = useCurrentCollectivite();
  const collectiviteId = collectivite?.collectiviteId;
  const referentielId = useReferentielId() as ReferentielParamOption;
  const { prevActionLink, nextActionLink } = usePrevAndNextActionLinks(
    action.id
  );
  const preuvesCount = useActionPreuvesCount(action);
  const showDescIntoInfoPanel = useShowDescIntoInfoPanel();

  const { data: indicateursLies } = useFilteredIndicateurDefinitions({
    filtre: {
      actionId: action.id,
      withChildren: true,
    },
  });

  const actionScores = useScoreRealise(action);

  const { status: auditStatus } = useCycleLabellisation(action.referentiel);

  if (!action || !collectivite) {
    return <Link href="./referentiels" />;
  }

  const activeTab = actionVue ? TABS_INDEX[actionVue] : TABS_INDEX['suivi'];

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
    const name = view?.[0] as ActionVueParamOption;

    // met à jour l'url
    if (collectiviteId && name && name !== actionVue) {
      router.replace(
        makeCollectiviteActionUrl({
          collectiviteId,
          referentielId,
          actionVue: name,
          actionId: action.id,
        })
      );
    }
  };

  if (!action || !collectiviteId) {
    return <Link href="./referentiels" />;
  }

  return (
    <>
      <ActionHeader
        action={action}
        actionScore={actionScores[action.id]}
        nextActionLink={nextActionLink}
        prevActionLink={prevActionLink}
      />
      <PageContainer
        dataTest={`Action-${action.identifiant}`}
        innerContainerClassName="pt-6"
        bgColor="white"
      >
        <OrientationQuickNav action={action} />
        <ActionAuditStatut action={action} />
        <ActionAuditDetail action={action} />

        {!showDescIntoInfoPanel && (
          <Alert
            className="mt-9"
            description={
              <div
                className="htmlContent"
                dangerouslySetInnerHTML={{
                  __html: addTargetToContentAnchors(action.description || ''),
                }}
              />
            }
          />
        )}

        <Tabs
          defaultActiveTab={activeTab}
          onChange={handleChange}
          className="fr-mt-9v"
        >
          <Tab label="Suivi de l'action" icon="seedling">
            <ActionFollowUp
              action={action}
              actionScores={actionScores}
              auditStatus={auditStatus}
            />
          </Tab>
          <Tab
            label={`Documents${
              preuvesCount !== undefined ? ` (${preuvesCount})` : ''
            }`}
            icon="file"
          >
            {activeTab === TABS_INDEX['preuves'] ? (
              <section>
                <ActionPreuvePanel withSubActions showWarning action={action} />
                <DownloadDocs action={action} />
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
              <FichesActionLiees actionId={action.id} />
            ) : (
              '...'
            )}
          </Tab>
          <Tab label="Historique" icon="history">
            {activeTab === TABS_INDEX['historique'] ? (
              <HistoriqueListe actionId={action.id} />
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
    </>
  );
};

export default Action;
