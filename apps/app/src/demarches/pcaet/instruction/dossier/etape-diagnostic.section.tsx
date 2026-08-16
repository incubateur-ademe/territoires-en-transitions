'use client';

import { resolveActiveTopic } from '@/app/demarches/active-topic';
import { DemarcheSection } from '@/app/demarches/components/section';
import { defaultVulnerabiliteState } from '@/app/demarches/pcaet/constants';
import { TopicGridView } from '@/app/demarches/pcaet/diagnostic/indicateurs-grid/topic-grid.view';
import { TopicTab } from '@/app/demarches/pcaet/diagnostic/topic-tab';
import { VulnerabiliteTable } from '@/app/demarches/pcaet/diagnostic/vulnerabilite-table';
import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { DemarchePcaetTopicKindEnum } from '@tet/domain/demarches';
import { Alert } from '@tet/ui';
import { Tabs, TabsList, TabsPanel } from '@tet/ui/design-system/TabsNext/index';
import { ReactNode, useState } from 'react';
import { useDiagnosticInstruction } from './data/use-diagnostic-instruction';

const noop = () => undefined;

export const EtapeDiagnosticSection = ({
  demandeAvisId,
  demarcheId,
  footer,
}: {
  demandeAvisId: number;
  demarcheId: number;
  footer: ReactNode;
}) => {
  const { diagnostic, isLoading, isError, refetch } =
    useDiagnosticInstruction(demandeAvisId);
  const [topicCode, setTopicCode] = useState<string | null>(null);

  const topics = diagnostic?.topics ?? [];
  const activeTopic = resolveActiveTopic(
    topics,
    topicCode,
    (topic) => topic.code
  );

  return (
    <DemarcheSection
      title={appLabels.instructionDossierEtapeDiagnostic}
      description={appLabels.instructionDossierEtapeDiagnosticDescription}
    >
      {isError ? (
        <ErrorCard
          title={appLabels.instructionDossierDiagnosticNonFige}
          retry={() => refetch()}
        />
      ) : isLoading || !diagnostic || !activeTopic ? (
        <SpinnerLoader className="m-auto" />
      ) : (
        <>
          {diagnostic.snapshotDate && (
            <Alert
              className="mb-6"
              state="info"
              description={appLabels.instructionDossierDiagnosticPhoto({
                date: getTextFormattedDate({ date: diagnostic.snapshotDate }),
              })}
            />
          )}

          <Tabs dataTest="demarches.pcaet.instruction.diagnostic-topics">
            <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 bg-transparent p-0 m-0 rounded-none w-full !list-none justify-stretch">
              {topics.map((topic) => (
                <TopicTab
                  key={topic.code}
                  topic={topic}
                  isActive={activeTopic.code === topic.code}
                  onSelect={() => setTopicCode(topic.code)}
                />
              ))}
            </TabsList>

            <TabsPanel className="mt-8">
              <div
                role="tabpanel"
                id={`demarche-topic-panel-${activeTopic.code}`}
                aria-labelledby={`demarche-topic-tab-${activeTopic.code}`}
              >
                {activeTopic.kind ===
                DemarchePcaetTopicKindEnum.VULNERABILITE ? (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-primary-9 m-0">
                      {appLabels.demarcheVulnerabiliteDescription}
                    </p>
                    <div className="max-xl:overflow-x-auto p-4 pt-2 lg:p-8 lg:pt-4 bg-white rounded-xl border border-grey-3">
                      <VulnerabiliteTable
                        value={defaultVulnerabiliteState()}
                        isReadonly
                        onChange={noop}
                      />
                    </div>
                  </div>
                ) : (
                  <TopicGridView
                    key={activeTopic.code}
                    demarcheId={demarcheId}
                    topic={activeTopic}
                    isReadonly
                  />
                )}
              </div>
            </TabsPanel>
          </Tabs>

          {footer}
        </>
      )}
    </DemarcheSection>
  );
};
