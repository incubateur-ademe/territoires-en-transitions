'use client';

import { resolveActiveTopic } from '@/app/demarches/active-topic';
import { getDiagnosticTopicStatut } from '@/app/demarches/completion';

import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import type { DemarchePcaetTopic } from '@tet/domain/demarches';
import {
  Tabs,
  TabsList,
  TabsPanel,
} from '@tet/ui/design-system/TabsNext/index';
import { DemarcheSection } from '../../components/section';
import { TopicDiagnosticPanelContent } from './topic-diagnostic-panel-content';
import { TopicTab } from './topic-tab';
import { useDemarcheTopicParam } from './use-topic-param';

type Props = {
  demarcheId: number;
  topics: DemarchePcaetTopic[];
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

export const DiagnosticTopicsSection = ({
  demarcheId,
  topics,
  isLoading,
  isError,
  onRetry,
  isReadonly,
  title,
  description,
}: Props) => {
  const [selectedTopicCode, setSelectedTopicCode] = useDemarcheTopicParam();
  const activeTopic = resolveActiveTopic(
    topics,
    selectedTopicCode,
    (topic) => topic.code
  );

  return (
    <DemarcheSection title={title} description={description}>
      {isError ? (
        <ErrorCard
          title={appLabels.demarcheDiagnosticErreurChargement}
          retry={onRetry}
        />
      ) : isLoading || !activeTopic ? (
        <SpinnerLoader className="m-auto" />
      ) : (
        <Tabs dataTest="demarches.pcaet.diagnostic.topics">
          <TabsList className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 bg-transparent p-0 m-0 rounded-none w-full !list-none justify-stretch">
            {topics.map((topic) => (
              <TopicTab
                key={topic.code}
                topic={topic}
                isActive={activeTopic.code === topic.code}
                statut={getDiagnosticTopicStatut(topic)}
                isComplete={getDiagnosticTopicStatut(topic) === 'complete'}
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
                demarcheId={demarcheId}
                isReadonly={isReadonly}
              />
            </div>
          </TabsPanel>
        </Tabs>
      )}
    </DemarcheSection>
  );
};
