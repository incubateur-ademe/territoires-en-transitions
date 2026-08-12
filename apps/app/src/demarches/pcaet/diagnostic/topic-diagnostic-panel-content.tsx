'use client';

import type {
  DemarchePcaet,
  DemarchePcaetVulnerabiliteState,
} from '@/app/demarches/types';
import { appLabels } from '@/app/labels/catalog';
import {
  DemarchePcaetTopicKindEnum,
  type DemarchePcaetTopic,
} from '@tet/domain/demarches';
import { TopicGridView } from './indicateurs-grid/topic-grid.view';
import { VulnerabiliteTable } from './vulnerabilite-table';

type Props = {
  topic: DemarchePcaetTopic;
  demarche: DemarchePcaet;
  isReadonly: boolean;
  onVulnerabiliteChange: (
    vulnerabilite: DemarchePcaetVulnerabiliteState
  ) => void;
};

export const TopicDiagnosticPanelContent = ({
  topic,
  demarche,
  isReadonly,
  onVulnerabiliteChange,
}: Props) => {
  // L'aiguillage est une donnée du référentiel, pas une liste de topics connue
  // du front.
  if (topic.kind === DemarchePcaetTopicKindEnum.VULNERABILITE) {
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

  return (
    <TopicGridView
      demarcheId={demarche.id}
      topic={topic}
      isReadonly={isReadonly}
    />
  );
};
