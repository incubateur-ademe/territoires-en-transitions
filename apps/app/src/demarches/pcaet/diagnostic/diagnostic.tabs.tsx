'use client';

import {
  getDiagnosticIndicateurTopicStatut,
  getDiagnosticVulnerabiliteTopicStatut,
} from '@/app/demarches/completion';
import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import {
  Tabs,
  TabsList,
  TabsPanel,
} from '@tet/ui/design-system/TabsNext/index';
import { DemarcheSection } from '../../components/section';
import type { PcaetDiagnostic as DiagnosticPayload } from './data/use-get-pcaet-diagnostic';
import { DiagnosticTabContent } from './diagnostic.tab-content';
import {
  isVulnerabiliteTab,
  listDiagnosticTabs,
} from './diagnostic.tabs.utils';
import { TopicTab } from './topic-tab';
import { usePcaetDiagnosticTabQueryState } from './use-pcaet-diagnostic-tab-query-state';

type Props = {
  demarcheId: number;
  // tabs: DiagnosticTopicTab[];
  diagnostic: DiagnosticPayload | null;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  isReadonly: boolean;
  /**
   * En finalisation, l'écran n'est plus une étape à compléter mais le rappel du
   * dossier transmis : c'est la page qui choisit lequel des deux il annonce.
   */
  title: string;
  description: string;
};

export const DiagnosticTabs = ({
  demarcheId,
  diagnostic,
  isLoading,
  isError,
  onRetry,
  isReadonly,
  title,
  description,
}: Props) => {
  const [selectedTab, setSelectedTab] = usePcaetDiagnosticTabQueryState();
  const tabs = diagnostic ? listDiagnosticTabs(diagnostic) : [];

  // Sans `?topic=` (ou avec un code inconnu), on retombe sur le premier volet :
  // l'URL pilote l'onglet, elle ne conditionne pas l'affichage de l'écran.
  const activeTab =
    tabs.find((tab) => tab.code === selectedTab) ?? tabs[0] ?? null;

  const activeConfig =
    diagnostic === null || activeTab === null
      ? null
      : diagnostic.indicateurParentConfigs.find(
          (config) => config.code === activeTab.code
        ) ?? null;

  const isVulnerabiliteActive =
    diagnostic !== null &&
    activeTab !== null &&
    isVulnerabiliteTab(activeTab, diagnostic.vulnerabilite.code);

  return (
    <DemarcheSection title={title} description={description}>
      {isError ? (
        <ErrorCard
          title={appLabels.demarcheDiagnosticErreurChargement}
          retry={onRetry}
        />
      ) : isLoading || !activeTab || diagnostic === null ? (
        <SpinnerLoader className="m-auto" />
      ) : (
        <Tabs
          variant="card"
          size="sm"
          dataTest="demarches.pcaet.diagnostic.topics"
        >
          <TabsList>
            {tabs.map((tab) => {
              const config = diagnostic.indicateurParentConfigs.find(
                (topic) => topic.code === tab.code
              );
              const statut = config
                ? getDiagnosticIndicateurTopicStatut(
                    config,
                    diagnostic.indicateurValeurs
                  )
                : getDiagnosticVulnerabiliteTopicStatut();
              return (
                <TopicTab
                  key={tab.code}
                  tab={tab}
                  isActive={activeTab.code === tab.code}
                  statut={statut}
                  onSelect={() => setSelectedTab(tab.code)}
                />
              );
            })}
          </TabsList>

          <TabsPanel className="mt-8">
            <DiagnosticTabContent
              key={activeTab.code}
              config={activeConfig}
              vulnerabilite={
                isVulnerabiliteActive ? diagnostic.vulnerabilite : null
              }
              definitions={diagnostic.indicateurDefinitions}
              valeurs={diagnostic.indicateurValeurs}
              demarcheId={demarcheId}
              isReadonly={isReadonly}
            />
          </TabsPanel>
        </Tabs>
      )}
    </DemarcheSection>
  );
};
