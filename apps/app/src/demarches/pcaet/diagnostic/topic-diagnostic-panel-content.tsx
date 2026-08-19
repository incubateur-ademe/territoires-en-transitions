'use client';

import { appLabels } from '@/app/labels/catalog';
import {
  DemarchePcaetTopicKindEnum,
  type DemarchePcaetTopic,
  type DemarchePcaetVulnerabilite,
} from '@tet/domain/demarches';
import { TopicGridView } from './indicateurs-grid/topic-grid.view';
import { VulnerabiliteTable } from './vulnerabilite-table';

/** Photo antérieure à ce volet : le tableau s'affiche vide plutôt qu'absent. */
const VULNERABILITE_VIDE: DemarchePcaetVulnerabilite = {
  thematiques: [],
  lignes: [],
};

type Props = {
  topic: DemarchePcaetTopic;
  demarcheId: number;
  isReadonly: boolean;
};

export const TopicDiagnosticPanelContent = ({
  topic,
  demarcheId,
  isReadonly,
}: Props) => {
  // L'aiguillage est une donnée du référentiel, pas une liste de topics connue
  // du front. Il ne dépend que du kind : une photo figée avant l'arrivée de ce
  // volet porte le topic sans son contenu, et la retomber sur la grille
  // d'indicateurs afficherait un tableau d'années sans rapport.
  if (topic.kind === DemarchePcaetTopicKindEnum.VULNERABILITE) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-primary-9 m-0">
          {appLabels.demarcheVulnerabiliteDescription}
        </p>
        <div className="max-xl:overflow-x-auto p-4 pt-2 lg:p-8 lg:pt-4 bg-white rounded-xl border border-grey-3">
          <VulnerabiliteTable
            vulnerabilite={topic.vulnerabilite ?? VULNERABILITE_VIDE}
            demarcheId={demarcheId}
            isReadonly={isReadonly}
          />
        </div>
      </div>
    );
  }

  return (
    <TopicGridView
      demarcheId={demarcheId}
      topic={topic}
      isReadonly={isReadonly}
    />
  );
};
