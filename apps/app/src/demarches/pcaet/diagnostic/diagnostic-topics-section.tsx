'use client';

import { getDiagnosticTopicStatut } from '@/app/demarches/completion';
import {
  DEMARCHE_PCAET_TOPICS,
  type DemarchePcaetTopicConfig,
} from '@/app/demarches/pcaet/constants';
import type {
  DemarchePcaet,
  DemarchePcaetTopicId,
  DemarchePcaetVulnerabiliteState,
} from '@/app/demarches/types';
import { appLabels } from '@/app/labels/catalog';
import {
  Tabs,
  TabsList,
  TabsPanel,
} from '@tet/ui/design-system/TabsNext/index';
import { useState } from 'react';
import { DemarcheSection } from '../../components/section';
import { TopicDiagnosticPanelContent } from './topic-diagnostic-panel-content';
import { TopicTab } from './topic-tab';

type Props = {
  collectiviteId: number;
  demarche: DemarchePcaet;
  isReadonly?: boolean;
  onVulnerabiliteChange: (
    vulnerabilite: DemarchePcaetVulnerabiliteState
  ) => void;
};

const getTopicById = (
  topicId: DemarchePcaetTopicId
): DemarchePcaetTopicConfig => {
  const topic = DEMARCHE_PCAET_TOPICS.find((item) => item.id === topicId);
  if (!topic) {
    throw new Error(`Unknown PCAET topic: ${topicId}`);
  }
  return topic;
};

export const DiagnosticTopicsSection = ({
  collectiviteId,
  demarche,
  isReadonly = false,
  onVulnerabiliteChange,
}: Props) => {
  const [activeTopicId, setActiveTopicId] = useState<DemarchePcaetTopicId>(
    DEMARCHE_PCAET_TOPICS[0].id
  );
  const activeTopic = getTopicById(activeTopicId);

  return (
    <DemarcheSection
      title={appLabels.demarcheDiagnosticTitre}
      description={appLabels.demarcheDiagnosticDescription}
    >
      <Tabs dataTest="demarche-pcaet-diagnostic-topics">
        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 bg-transparent p-0 m-0 rounded-none w-full !list-none justify-stretch">
          {DEMARCHE_PCAET_TOPICS.map((topic) => (
            <TopicTab
              key={topic.id}
              topic={topic}
              isActive={activeTopicId === topic.id}
              isComplete={
                getDiagnosticTopicStatut(demarche, topic.id) === 'complete'
              }
              onSelect={() => setActiveTopicId(topic.id)}
            />
          ))}
        </TabsList>

        <TabsPanel className="mt-8">
          <div
            role="tabpanel"
            id={`demarche-topic-panel-${activeTopicId}`}
            aria-labelledby={`demarche-topic-tab-${activeTopicId}`}
          >
            <TopicDiagnosticPanelContent
              key={activeTopicId}
              topic={activeTopic}
              collectiviteId={collectiviteId}
              demarche={demarche}
              isReadonly={isReadonly}
              onVulnerabiliteChange={onVulnerabiliteChange}
            />
          </div>
        </TabsPanel>
      </Tabs>
    </DemarcheSection>
  );
};
