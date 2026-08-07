'use client';

import type { DemarchePcaetTopicConfig } from '@/app/demarches/pcaet/constants';
import type {
  DemarchePcaet,
  DemarchePcaetVulnerabiliteState,
} from '@/app/demarches/types';
import { TOPIC_GRID_SHAPES } from '@/app/demarches/pcaet/diagnostic/indicateurs-grid/topic-grid-shapes';
import { TopicGridView } from '@/app/demarches/pcaet/diagnostic/indicateurs-grid/topic-grid.view';
import { appLabels } from '@/app/labels/catalog';
import Link from 'next/link';
import { TopicIndicateurModalContent } from './topic-indicateur-modal-content';
import { VulnerabiliteTable } from './vulnerabilite-table';

type Props = {
  topic: DemarchePcaetTopicConfig;
  collectiviteId: number;
  demarche: DemarchePcaet;
  isReadonly?: boolean;
  onVulnerabiliteChange: (
    vulnerabilite: DemarchePcaetVulnerabiliteState
  ) => void;
};

export const TopicDiagnosticPanelContent = ({
  topic,
  collectiviteId,
  demarche,
  isReadonly = false,
  onVulnerabiliteChange,
}: Props) => {
  const gridShape = TOPIC_GRID_SHAPES[topic.id];
  if (gridShape) {
    return (
      <TopicGridView
        demarcheId={demarche.id}
        topicId={topic.id}
        shape={gridShape}
        title={topic.label}
      />
    );
  }

  if (topic.id === 'vulnerabilite_territoire') {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-primary-9 m-0">
          {appLabels.demarcheVulnerabiliteDescription}
        </p>
        <div className="max-xl:overflow-x-auto p-4 pt-2 lg:p-8 lg:pt-4 bg-white rounded-xl border border-grey-3">
          <VulnerabiliteTable
            value={demarche.vulnerabilite}
            isReadonly={isReadonly}
            onChange={onVulnerabiliteChange}
          />
        </div>
      </div>
    );
  }

  if (!topic.indicateurIdentifiantReferentiel) {
    return (
      <p className="text-sm text-grey-7">
        {appLabels.demarcheTopicModalAucunIndicateur}{' '}
        <Link
          href={topic.href(collectiviteId, demarche.id)}
          className="text-primary-8 underline"
        >
          {appLabels.demarcheTopicModalAccederPage}
        </Link>
      </p>
    );
  }

  return (
    <TopicIndicateurModalContent
      collectiviteId={collectiviteId}
      indicateurIdentifiantReferentiel={topic.indicateurIdentifiantReferentiel}
      topicLabel={topic.label}
      isReadonly={isReadonly}
    />
  );
};
