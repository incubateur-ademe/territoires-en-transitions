'use client';

import { resolveActiveTopic } from '@/app/demarches/active-topic';
import { getDiagnosticTopicStatut } from '@/app/demarches/completion';
import type {
  DemarchePcaet,
  DemarchePcaetVulnerabiliteState,
} from '@/app/demarches/types';
import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Alert } from '@tet/ui';
import {
  Tabs,
  TabsList,
  TabsPanel,
} from '@tet/ui/design-system/TabsNext/index';
import { DemarcheSection } from '../../components/section';
import type { DemarchePcaetTopic } from '@tet/domain/demarches';
import { TopicDiagnosticPanelContent } from './topic-diagnostic-panel-content';
import { TopicTab } from './topic-tab';
import { useDemarcheTopicParam } from './use-topic-param';

type Props = {
  demarche: DemarchePcaet;
  topics: DemarchePcaetTopic[];
  isLoading: boolean;
  /** Date de la photo servie, quand le dossier est déjà transmis. */
  snapshotDate: string | null;
  isReadonly: boolean;
  onVulnerabiliteChange: (
    vulnerabilite: DemarchePcaetVulnerabiliteState
  ) => void;
};

export const DiagnosticTopicsSection = ({
  demarche,
  topics,
  isLoading,
  snapshotDate,
  isReadonly,
  onVulnerabiliteChange,
}: Props) => {
  const [selectedTopicCode, setSelectedTopicCode] = useDemarcheTopicParam();
  const activeTopic = resolveActiveTopic(
    topics,
    selectedTopicCode,
    (topic) => topic.code
  );

  return (
    <DemarcheSection
      title={appLabels.demarcheDiagnosticTitre}
      description={appLabels.demarcheDiagnosticDescription}
    >
      {isLoading || !activeTopic ? (
        <SpinnerLoader className="m-auto" />
      ) : (
        <>
          {snapshotDate !== null && (
            <Alert
              className="mb-6"
              state="info"
              title={appLabels.demarcheDiagnosticPhotoTitre}
              description={appLabels.demarcheDiagnosticPhotoDescription({
                date: new Date(snapshotDate).toLocaleDateString('fr-FR'),
              })}
            />
          )}
          <Tabs dataTest="demarches.pcaet.diagnostic.topics">
          <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 bg-transparent p-0 m-0 rounded-none w-full !list-none justify-stretch">
            {topics.map((topic) => (
              <TopicTab
                key={topic.code}
                topic={topic}
                isActive={activeTopic.code === topic.code}
                isComplete={
                  getDiagnosticTopicStatut(demarche, topic) === 'complete'
                }
                onSelect={() => setSelectedTopicCode(topic.code)}
              />
            ))}
          </TabsList>

          <TabsPanel className="mt-8">
            <div
              role="tabpanel"
              id={`demarche-topic-panel-${activeTopic.code}`}
              aria-labelledby={`demarche-topic-tab-${activeTopic.code}`}
            >
              <TopicDiagnosticPanelContent
                key={activeTopic.code}
                topic={activeTopic}
                demarche={demarche}
                isReadonly={isReadonly}
                onVulnerabiliteChange={onVulnerabiliteChange}
              />
            </div>
          </TabsPanel>
          </Tabs>
        </>
      )}
    </DemarcheSection>
  );
};
