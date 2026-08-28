'use client';

import { resolveActiveTopic } from '@/app/demarches/active-topic';
import {
  getDiagnosticIndicateurTopicStatut,
  getDiagnosticVulnerabiliteTopicStatut,
} from '@/app/demarches/completion';
import { DemarcheSection } from '@/app/demarches/components/section';
import { isVulnerabiliteTab } from '@/app/demarches/pcaet/diagnostic/diagnostic.tabs.utils';
import { DiagnosticIndicateurTabContent } from '@/app/demarches/pcaet/diagnostic/indicateurs-grid/diagnostic.indicateur.tab-content';
import { TopicTab } from '@/app/demarches/pcaet/diagnostic/topic-tab';
import { VulnerabiliteTable } from '@/app/demarches/pcaet/diagnostic/vulnerabilite-table';
import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import {
  Tabs,
  TabsList,
  TabsPanel,
} from '@tet/ui/design-system/TabsNext/index';
import { useState } from 'react';
import { listDiagnosticTabs } from '../../diagnostic/diagnostic.tabs.utils';
import { useDiagnosticInstruction } from './data/use-diagnostic-instruction';

export const EtapeDiagnosticSection = ({
  demandeAvisId,
  demarcheId,
}: {
  demandeAvisId: number;
  demarcheId: number;
}) => {
  const { diagnostic, isLoading, isError, refetch } =
    useDiagnosticInstruction(demandeAvisId);
  const [topicCode, setTopicCode] = useState<string | null>(null);

  const tabs = diagnostic ? listDiagnosticTabs(diagnostic) : [];
  const activeTab = resolveActiveTopic(tabs, topicCode, (tab) => tab.code);
  const activeConfig =
    diagnostic === undefined || activeTab === null
      ? null
      : diagnostic.indicateurParentConfigs.find(
          (config) => config.code === activeTab.code
        ) ?? null;
  const isVulnerabiliteActive =
    diagnostic !== undefined &&
    activeTab !== null &&
    isVulnerabiliteTab(activeTab, diagnostic.vulnerabilite.code);

  return (
    <DemarcheSection
      title={appLabels.instructionDossierEtapeDiagnostic}
      description={appLabels.instructionDossierEtapeDiagnosticDescription}
    >
      {isError ? (
        <ErrorCard
          title={appLabels.demarcheDiagnosticErreurChargement}
          retry={() => refetch()}
        />
      ) : isLoading || !diagnostic || !activeTab ? (
        <SpinnerLoader className="m-auto" />
      ) : (
        <>
          <Tabs dataTest="demarches.pcaet.instruction.diagnostic-topics">
            <TabsList className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 bg-transparent p-0 m-0 rounded-none w-full !list-none justify-stretch">
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
                    onSelect={() => setTopicCode(tab.code)}
                  />
                );
              })}
            </TabsList>

            <TabsPanel className="mt-8">
              <div
                role="tabpanel"
                id={`demarche-topic-panel-${activeTab.code}`}
                aria-labelledby={`demarche-topic-tab-${activeTab.code}`}
              >
                {isVulnerabiliteActive ? (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-primary-9 m-0">
                      {appLabels.demarcheVulnerabiliteDescription}
                    </p>
                    <div className="max-xl:overflow-x-auto p-4 pt-2 lg:p-8 lg:pt-4 bg-white rounded-xl border border-grey-3">
                      <VulnerabiliteTable
                        vulnerabilite={{
                          thematiques: diagnostic.vulnerabilite.thematiques,
                          lignes: diagnostic.vulnerabilite.lignes,
                        }}
                        demarcheId={demarcheId}
                        isReadonly
                      />
                    </div>
                  </div>
                ) : activeConfig ? (
                  <DiagnosticIndicateurTabContent
                    definitions={diagnostic.indicateurDefinitions}
                    key={activeConfig.code}
                    demarcheId={demarcheId}
                    config={activeConfig}
                    valeurs={diagnostic.indicateurValeurs}
                    isReadonly
                  />
                ) : null}
              </div>
            </TabsPanel>
          </Tabs>
        </>
      )}
    </DemarcheSection>
  );
};
